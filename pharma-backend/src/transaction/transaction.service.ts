import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import {
    CommitTransactionDto,
    CriteriaDto,
    IncomeAnalysisDto,
    IncomeOutcomeAnalysisDto,
    OutcomeSupplierAnalysisDto,
} from './dto';
import { PaymentType, TransactionType, VAT } from './enums';
import { plainToInstance } from 'class-transformer';
import { OutcomeAnalysisDto } from './dto/outcome-analysis.dto';
import { SupplierType } from './enums/supplier-type.enum';
import { UserService } from '../authbroker/users';

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly userService: UserService,
        @InjectConnection()
        private readonly connection: Connection,
    ) {}

    public async commit(dto: CommitTransactionDto): Promise<any> {
        const transactions: Transaction[] = [];
        for (const tr of dto.transactions) {
            const transaction = new Transaction();
            transaction.transactionType = tr.transactionType;
            transaction.paymentType = tr.paymentType;
            transaction.vat = tr.vat;
            transaction.cost = tr.cost;
            transaction.createdAt = tr.createdAt;
            transaction.supplierType = tr.supplierType;
            transaction.comment = tr.comment;
            transaction.user = await this.userService.findOneOrFail(tr.userId);
            transactions.push(transaction);
        }
        try {
            return await this.transactionRepository.save(transactions);
        } catch (e) {
            this.logger.error('Commit transactions failed with error ' + e);
        }
    }

    public async update(dto: CommitTransactionDto): Promise<any> {
        for (const tr of dto.transactions) {
            await this.transactionRepository.update(
                {
                    id: tr.id,
                },
                {
                    cost: tr.cost,
                },
            );
        }
    }

    async getAllTransactionsByCriteria(
        criteriaDto: CriteriaDto,
    ): Promise<Transaction[]> {
        console.log(criteriaDto);
        const query = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.userId = :userId ', {
                userId: criteriaDto.userId,
            })
            .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                dateFrom: criteriaDto.dateFrom,
            });
        if (criteriaDto.transactionType) {
            query.andWhere(
                'transaction.transactionType in (:...transactionType) ',
                {
                    transactionType: criteriaDto.transactionType,
                },
            );
        }
        if (criteriaDto.supplierType) {
            query.andWhere('transaction.supplierType= :supplierType ', {
                supplierType: criteriaDto.supplierType,
            });
        }
        if (criteriaDto.paymentType) {
            query.andWhere('transaction.paymentType in (:...paymentType) ', {
                paymentType: criteriaDto.paymentType,
            });
        }

        if (criteriaDto.dateTo !== undefined) {
            query.andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                dateTo: criteriaDto.dateTo,
            });
        }
        return query.getMany();
    }

    async getSalesStatisticsByCriteria(
        criteria: CriteriaDto,
    ): Promise<IncomeOutcomeAnalysisDto> {
        const incomeOutcomeAnalysisDto = new IncomeOutcomeAnalysisDto();
        incomeOutcomeAnalysisDto.income = plainToInstance(IncomeAnalysisDto, {
            incomePerVat: await this.getIncomePerVatType(criteria),
            totalCash: await this.getTotalCash(criteria),
            totalPos: await this.getTotalPos(criteria),
            totalEOPPY: await this.getTotalEOPPY(criteria),
            totalOnAccount: await this.getTotalOnAccount(criteria),
            totalPreviousMonths: await this.getTotalPreviousMonths(criteria),
        });
        incomeOutcomeAnalysisDto.outcome = plainToInstance(OutcomeAnalysisDto, {
            outcomePerVat: await this.getOutcomePerVatType(criteria),
            suppliers: plainToInstance(OutcomeSupplierAnalysisDto, {
                mainSupplier: await this.getOutcomeForMainSupplier(criteria),
                otherSuppliers: await this.getOutcomeForOtherSuppliers(
                    criteria,
                ),
            }),
            exchange: await this.getExchanges(criteria),
        });
        incomeOutcomeAnalysisDto.other = await this.getOtherTransactionValues(
            criteria,
        );
        return incomeOutcomeAnalysisDto;
    }

    createAndExecuteCriteriaQuery(criteria: CriteriaDto) {
        const query = this.transactionRepository
            .createQueryBuilder('transaction')
            .select('sum(cast (cost as numeric)) as total')
            .where('transaction.userId = :userId ', {
                userId: criteria.userId,
            })
            .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                dateFrom: criteria.dateFrom,
            })
            .andWhere('transaction.transactionType in (:...transactionType) ', {
                transactionType: criteria.transactionType,
            })
            .andWhere('transaction.paymentType in (:...paymentType) ', {
                paymentType: criteria.paymentType,
            })
            .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                dateTo: criteria.dateTo,
            });
        if (criteria.supplierType) {
            query.andWhere('transaction.supplierType= :supplierType ', {
                supplierType: criteria.supplierType,
            });
        }
        return query.getRawOne().then((rs) => {
            if (rs.total == null) {
                return 0;
            } else {
                return +rs.total;
            }
        });
    }

    private getTotalCash(criteria: CriteriaDto) {
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.CASH];
        return this.createAndExecuteCriteriaQuery(criteria);
    }

    private async getTotalPos(criteria: CriteriaDto) {
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.POS];
        return this.createAndExecuteCriteriaQuery(criteria);
    }

    private async getTotalEOPPY(criteria: CriteriaDto) {
        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        return this.createAndExecuteCriteriaQuery(criteria);
    }

    private async getTotalOnAccount(criteria: CriteriaDto) {
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        return this.createAndExecuteCriteriaQuery(criteria);
    }

    private getIncomePerVatType(criteria: CriteriaDto): Record<string, number> {
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.NONE];
        const query = this.createPerVatTypeQuery(criteria);
        const values: Partial<Record<VAT, number>> = {};
        query.getRawMany().then((rs) => {
            rs.forEach((totalAndVat) => {
                values[totalAndVat.vat] = +totalAndVat.total;
            });
        });
        return values;
    }

    private async getTotalPreviousMonths(criteria: CriteriaDto) {
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.PREVIOUS_MONTHS_RECEIPTS];
        return this.createAndExecuteCriteriaQuery(criteria);
    }

    private async getOutcomePerVatType(criteria: CriteriaDto) {
        criteria.transactionType = [TransactionType.EXPENSE];
        criteria.paymentType = [PaymentType.CASH, PaymentType.ON_ACCOUNT];
        const query = this.createPerVatTypeQuery(criteria);
        const values: Partial<Record<VAT, number>> = {};
        query.getRawMany().then((rs) => {
            rs.forEach((totalAndVat) => {
                values[totalAndVat.vat] = +totalAndVat.total;
            });
        });
        console.log(values);
        return values;
    }

    private createPerVatTypeQuery(criteria: CriteriaDto) {
        return this.transactionRepository
            .createQueryBuilder('transaction')
            .select('sum(cast (cost as numeric)) as total, vat')
            .where('transaction.userId = :userId ', {
                userId: criteria.userId,
            })
            .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                dateFrom: criteria.dateFrom,
            })
            .andWhere('transaction.transactionType in (:...transactionType) ', {
                transactionType: criteria.transactionType,
            })
            .andWhere('transaction.paymentType in (:...paymentType) ', {
                paymentType: criteria.paymentType,
            })
            .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                dateTo: criteria.dateTo,
            })
            .groupBy('vat');
    }

    private async getExchanges(criteria: CriteriaDto) {
        return 0;
    }

    private async getOutcomeForOtherSuppliers(criteria: CriteriaDto) {
        const values: Partial<
            Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
        > = {};

        criteria.transactionType = [TransactionType.EXPENSE];
        criteria.supplierType = SupplierType.OTHER;

        criteria.paymentType = [PaymentType.CASH];
        values[PaymentType.CASH] = await this.createAndExecuteCriteriaQuery(
            criteria,
        );

        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        values[PaymentType.ON_ACCOUNT] =
            await this.createAndExecuteCriteriaQuery(criteria);
        return values;
    }

    private async getOutcomeForMainSupplier(criteria: CriteriaDto) {
        const values: Partial<Record<PaymentType.ON_ACCOUNT, number>> = {};

        criteria.transactionType = [TransactionType.EXPENSE];
        criteria.supplierType = SupplierType.MAIN;
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        values[PaymentType.ON_ACCOUNT] =
            await this.createAndExecuteCriteriaQuery(criteria);
        return values;
    }

    private async getOtherTransactionValues(criteria: CriteriaDto) {
        const values: Partial<Record<TransactionType, number>> = {};
        criteria.transactionType = [TransactionType.PERSONAL_WITHDRAWALS];
        criteria.paymentType = [PaymentType.CASH, PaymentType.BANK];
        criteria.supplierType = SupplierType.NONE;
        values[TransactionType.PERSONAL_WITHDRAWALS] =
            await this.createAndExecuteCriteriaQuery(criteria);
        return values;
    }
}

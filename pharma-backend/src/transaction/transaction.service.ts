import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CommitTransactionDto } from './dto';
import { UserService } from '../authbroker/users';
import { CriteriaDto } from '../statistics/dto';
import { getMonthRanges, getWeek } from '../common';
import { RangeType } from '../statistics/enums/range-type.enum';
import { PaymentType, SupplierType, TransactionType } from './enums';

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
        const query = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.userId = :userId ', {
                userId: criteriaDto.userId,
            });
        let dateRange;
        if (criteriaDto.range == RangeType.WEEKLY) {
            dateRange = getWeek(new Date(criteriaDto.date));
            query
                .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                    dateFrom: dateRange.dateFrom,
                })
                .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                    dateTo: dateRange.dateTo,
                });
        } else if (criteriaDto.range == RangeType.MONTHLY) {
            dateRange = getMonthRanges(criteriaDto.range, criteriaDto.date);
            query
                .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                    dateFrom: dateRange[0].dateFrom,
                })
                .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                    dateTo: dateRange[0].dateTo,
                });
        } else if (criteriaDto.range == RangeType.DAILY) {
            query.andWhere('CAST ("createdAt" AS DATE) = :dateFrom ', {
                dateFrom: criteriaDto.date,
            });
        }

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
        return query.getMany();
    }

    async getAllOperatingExpensesByDateRange(
        criteria: CriteriaDto,
        dateFrom: string,
    ) {
        criteria.date = dateFrom;
        criteria.range = RangeType.MONTHLY;
        criteria.transactionType = [
            TransactionType.RENT,
            TransactionType.INSURANCE_CONTRIBUTION,
            TransactionType.PAYROLL,
            TransactionType.EFKA,
            TransactionType.ACCOUNTANT,
            TransactionType.ELECTRICITY_BILL,
            TransactionType.PHONE_BILL,
            TransactionType.CONSUMABLES,
            TransactionType.BANK_CHARGES,
            TransactionType.WATER_SUPPLY,
            TransactionType.OTHER_EXPENSES,
        ];
        return this.getAllTransactionsByCriteria(criteria);
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreateTransactionDto } from './dto';
import { UserService } from '../authbroker/users';
import { CriteriaDto } from '../statistics/dto';
import { getMonthRanges, getWeek, toDateFromDBFormat } from '../common';
import { RangeType } from '../statistics/enums/range-type.enum';
import { TransactionType } from './enums';

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

    public async commit(dto: CreateTransactionDto): Promise<any> {
        const transaction = new Transaction();
        transaction.transactionType = dto.transactionType;
        transaction.paymentType = dto.paymentType;
        transaction.vat = dto.vat;
        transaction.cost = dto.cost;
        transaction.createdAt = toDateFromDBFormat(dto.createdAt);
        transaction.supplierType = dto.supplierType;
        transaction.comment = dto.comment;
        transaction.user = await this.userService.findOneOrFail(dto.userId);
        try {
            return await this.transactionRepository.save(transaction);
        } catch (e) {
            this.logger.error('Commit transactions failed with error ' + e);
        }
    }

    public async update(id: string, dto: CreateTransactionDto): Promise<any> {
        delete dto.userId;
        await this.transactionRepository.update(id, dto);
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

    async getAllTaxesByDateRange(criteria: CriteriaDto, dateFrom: string) {
        criteria.date = dateFrom;
        criteria.range = RangeType.MONTHLY;
        criteria.transactionType = [TransactionType.TAXES];
        return this.getAllTransactionsByCriteria(criteria);
    }
}

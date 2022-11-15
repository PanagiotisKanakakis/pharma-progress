import { Injectable, Logger } from '@nestjs/common';
import {
    PaymentType,
    SupplierType,
    Transaction,
    TransactionType,
    VAT,
} from '../transaction';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CriteriaDto, StatisticsDto } from './dto';
import { getMonthRanges } from '../common';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class StatisticsService {
    public readonly logger = new Logger(StatisticsService.name);

    constructor(
        @InjectRepository(Transaction)
        public readonly transactionRepository: Repository<Transaction>,
        @InjectConnection()
        public readonly connection: Connection,
        public readonly transactionService: TransactionService,
    ) {}

    async getStatisticsByCriteria(
        criteria: CriteriaDto,
    ): Promise<StatisticsDto> {
        const statistics = new StatisticsDto();
        const dateRanges = getMonthRanges(criteria.range, criteria.date);

        for (const dateRange of dateRanges) {
            const dateFrom = dateRange.dateFrom;
            const dateTo = dateRange.dateTo;
            statistics[dateFrom] = {
                incomePerVat: await this.getIncomePerVatType(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                outcomePerVat: await this.getOutcomePerVatType(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                totalCash: await this.getTotalCash(criteria, dateFrom, dateTo),
                totalPos: await this.getTotalPos(criteria, dateFrom, dateTo),
                totalExtra: await this.getTotalExtra(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                totalEOPPYOnAccount: await this.getTotalEOPPYOnAccount(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                totalEOPPYIncome: await this.getTotalEOPPYIncome(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                totalOnAccount: await this.getTotalOnAccount(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                totalPreviousMonths: await this.getTotalPreviousMonths(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                totalIncome: await this.getTotalIncome(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                operatingExpenses:
                    await this.getAllOperatingExpensesByDateRange(
                        criteria,
                        dateFrom,
                    ),
                other: await this.getOtherTransactionValues(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                exchange: await this.getExchanges(criteria, dateFrom, dateTo),
                suppliers: {
                    mainSupplier: {
                        outcome: await this.getOutcomeForMainSupplier(
                            criteria,
                            dateFrom,
                            dateTo,
                        ),
                        payment: await this.getPaymentForMainSupplier(
                            criteria,
                            dateFrom,
                            dateTo,
                        ),
                    },
                    otherSuppliers: {
                        outcome: await this.getOutcomeForOtherSuppliers(
                            criteria,
                            dateFrom,
                            dateTo,
                        ),
                        payment: await this.getPaymentForOtherSuppliers(
                            criteria,
                            dateFrom,
                            dateTo,
                        ),
                    },
                },
            };
        }
        return statistics;
    }

    createAndExecuteCriteriaQuery(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const query = this.transactionRepository
            .createQueryBuilder('transaction')
            .select('sum(cast (cost as numeric)) as total')
            .where('transaction.userId = :userId ', {
                userId: criteria.userId,
            })
            .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                dateFrom: dateFrom,
            })
            .andWhere('transaction.transactionType in (:...transactionType) ', {
                transactionType: criteria.transactionType,
            })
            .andWhere('transaction.paymentType in (:...paymentType) ', {
                paymentType: criteria.paymentType,
            })
            .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                dateTo: dateTo,
            });
        if (criteria.supplierType) {
            query.andWhere('transaction.supplierType= :supplierType ', {
                supplierType: criteria.supplierType,
            });
        }
        if (criteria.vatType) {
            query.andWhere('transaction.vat in (:...vatType) ', {
                vatType: criteria.vatType,
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

    public getTotalCash(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.CASH];
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public async getTotalPos(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.POS];
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public async getTotalExtra(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.EXTRA];
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public async getTotalEOPPYOnAccount(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<Record<VAT.SIX | VAT.THIRTEEN, number>> = {};

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];

        criteria.vatType = [VAT.SIX];
        values[VAT.SIX] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];

        criteria.vatType = [VAT.THIRTEEN];
        values[VAT.THIRTEEN] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        return values;
    }

    public async getTotalEOPPYIncome(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<Record<VAT.SIX | VAT.THIRTEEN, number>> = {};

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.BANK];
        criteria.vatType = [VAT.SIX];
        values[VAT.SIX] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.BANK];
        criteria.vatType = [VAT.THIRTEEN];
        values[VAT.THIRTEEN] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        return values;
    }

    public async getTotalOnAccount(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public getIncomePerVatType(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.NONE];
        const query = this.createPerVatTypeQuery(criteria, dateFrom, dateTo);
        const values: Partial<Record<VAT, number>> = {};
        query.getRawMany().then((rs) => {
            rs.forEach((totalAndVat) => {
                values[totalAndVat.vat] = +totalAndVat.total;
            });
        });
        return values;
    }

    public async getTotalPreviousMonths(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.PREVIOUS_MONTHS_RECEIPTS];
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public async getOutcomePerVatType(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.EXPENSE];
        criteria.paymentType = [PaymentType.CASH, PaymentType.ON_ACCOUNT];
        const query = this.createPerVatTypeQuery(criteria, dateFrom, dateTo);
        const values: Partial<Record<VAT, number>> = {};
        query.getRawMany().then((rs) => {
            rs.forEach((totalAndVat) => {
                values[totalAndVat.vat] = +totalAndVat.total;
            });
        });
        return values;
    }

    public async getTotalCashPurchases(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const paymentForOtherSuppliers = await this.getPaymentForOtherSuppliers(
            criteria,
            dateFrom,
            dateTo,
        );
        const paymentForMainSupplier = await this.getPaymentForMainSupplier(
            criteria,
            dateFrom,
            dateTo,
        );
        const cashOutcomeToOtherSuppliers =
            await this.getOutcomeForOtherSuppliers(criteria, dateFrom, dateTo);
        return (
            +paymentForOtherSuppliers +
            +paymentForMainSupplier +
            +cashOutcomeToOtherSuppliers
        );
    }

    public async getTotalOperatingExpenses(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
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
            TransactionType.TAXES,
            TransactionType.OTHER_EXPENSES,
        ];
        criteria.vatType = undefined;
        criteria.paymentType = [PaymentType.CASH];
        criteria.supplierType = SupplierType.NONE;
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public createPerVatTypeQuery(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        return this.transactionRepository
            .createQueryBuilder('transaction')
            .select('sum(cast (cost as numeric)) as total, vat')
            .where('transaction.userId = :userId ', {
                userId: criteria.userId,
            })
            .andWhere('CAST ("createdAt" AS DATE) >= :dateFrom ', {
                dateFrom: dateFrom,
            })
            .andWhere('transaction.transactionType in (:...transactionType) ', {
                transactionType: criteria.transactionType,
            })
            .andWhere('transaction.paymentType in (:...paymentType) ', {
                paymentType: criteria.paymentType,
            })
            .andWhere('CAST ("createdAt" AS DATE) <= :dateTo ', {
                dateTo: dateTo,
            })
            .groupBy('vat');
    }

    public async getExchanges(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        return 0;
    }

    public async getOutcomeForOtherSuppliers(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<
            Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
        > = {};

        criteria.transactionType = [TransactionType.EXPENSE];
        criteria.supplierType = SupplierType.OTHER;
        criteria.vatType = undefined;
        criteria.paymentType = [PaymentType.CASH];
        values[PaymentType.CASH] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );

        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        values[PaymentType.ON_ACCOUNT] =
            await this.createAndExecuteCriteriaQuery(
                criteria,
                dateFrom,
                dateTo,
            );
        return values;
    }

    public async getPaymentForOtherSuppliers(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<
            Record<PaymentType.CASH | PaymentType.BANK, number>
        > = {};
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.PAYMENT];
        criteria.supplierType = SupplierType.OTHER;
        criteria.paymentType = [PaymentType.CASH];
        values[PaymentType.CASH] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        criteria.paymentType = [PaymentType.BANK];
        values[PaymentType.BANK] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        return values;
    }

    public async getOutcomeForMainSupplier(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<Record<PaymentType.ON_ACCOUNT, number>> = {};
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.EXPENSE];
        criteria.supplierType = SupplierType.MAIN;
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        values[PaymentType.ON_ACCOUNT] =
            await this.createAndExecuteCriteriaQuery(
                criteria,
                dateFrom,
                dateTo,
            );
        return values;
    }

    public async getPaymentForMainSupplier(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<
            Record<PaymentType.CASH | PaymentType.BANK, number>
        > = {};
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.PAYMENT];
        criteria.supplierType = SupplierType.MAIN;
        criteria.paymentType = [PaymentType.CASH];
        values[PaymentType.CASH] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        criteria.paymentType = [PaymentType.BANK];
        values[PaymentType.BANK] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        return values;
    }

    public async getOtherTransactionValues(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        const values: Partial<Record<TransactionType, number>> = {};
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.PERSONAL_WITHDRAWALS];
        criteria.paymentType = [PaymentType.CASH, PaymentType.BANK];
        criteria.supplierType = SupplierType.NONE;
        values[TransactionType.PERSONAL_WITHDRAWALS] =
            await this.createAndExecuteCriteriaQuery(
                criteria,
                dateFrom,
                dateTo,
            );
        return values;
    }

    public async getTotalIncome(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.CASH, PaymentType.POS];
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    private async getAllOperatingExpensesByDateRange(
        criteria: CriteriaDto,
        dateFrom: string,
    ) {
        criteria.vatType = undefined;
        criteria.paymentType = [PaymentType.CASH, PaymentType.BANK];
        const transactions =
            await this.transactionService.getAllOperatingExpensesByDateRange(
                criteria,
                dateFrom,
            );
        const operatingExpenses: Partial<
            Record<TransactionType, Transaction[]>
        > = {};

        transactions.forEach((transaction) => {
            if (operatingExpenses[transaction.transactionType] == undefined) {
                operatingExpenses[transaction.transactionType] = [];
            }
            operatingExpenses[transaction.transactionType].push(transaction);
        });

        return operatingExpenses;
    }
}

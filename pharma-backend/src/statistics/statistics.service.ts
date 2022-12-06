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
import { RangeType } from './enums/range-type.enum';
import { PrescriptionService } from '../prescriptions/prescription.service';

@Injectable()
export class StatisticsService {
    public readonly logger = new Logger(StatisticsService.name);

    constructor(
        @InjectRepository(Transaction)
        public readonly transactionRepository: Repository<Transaction>,
        @InjectConnection()
        public readonly connection: Connection,
        public readonly transactionService: TransactionService,
        public readonly prescriptionService: PrescriptionService,
    ) {}

    async getStatisticsByCriteria(
        criteria: CriteriaDto,
    ): Promise<StatisticsDto> {
        const statistics = new StatisticsDto();
        const dateRanges = getMonthRanges(criteria.range, criteria.date);

        for (const dateRange of dateRanges) {
            const dateFrom = dateRange.dateFrom;
            const dateTo = dateRange.dateTo;
            criteria.date = dateFrom;
            statistics[dateFrom] = {
                weeklyIncome: await this.getWeeklyIncome(criteria, dateFrom),
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
                threeMonthPeriodVat: await this.getThreeMonthPeriodVat(
                    criteria,
                    dateFrom,
                ),
                totalPrescriptions: await this.getTotalPrescriptions(
                    criteria,
                    dateFrom,
                    dateTo,
                ),
                operatingExpenses:
                    await this.getAllOperatingExpensesByDateRange(
                        criteria,
                        dateFrom,
                    ),
                taxes: await this.getAllTaxesByDateRange(criteria, dateFrom),
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

    async createAndExecuteCriteriaQuery(
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
        const rs = await query.getRawOne();
        if (rs.total == null) {
            return 0;
        } else {
            return +rs.total;
        }
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
        const values: Record<VAT.SIX | VAT.THIRTEEN, number> = {
            '2': 0,
            '3': 0,
        };

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        criteria.supplierType = SupplierType.NONE;
        criteria.vatType = [VAT.SIX];
        values[VAT.SIX] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.ON_ACCOUNT];
        criteria.supplierType = SupplierType.NONE;
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
        const values: Record<VAT.SIX | VAT.THIRTEEN, number> = {
            '2': 0,
            '3': 0,
        };

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.BANK];
        criteria.vatType = [VAT.SIX];
        criteria.supplierType = SupplierType.NONE;
        values[VAT.SIX] = await this.createAndExecuteCriteriaQuery(
            criteria,
            dateFrom,
            dateTo,
        );

        criteria.transactionType = [TransactionType.EOPPY];
        criteria.paymentType = [PaymentType.BANK];
        criteria.vatType = [VAT.THIRTEEN];
        criteria.supplierType = SupplierType.NONE;
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
        criteria.supplierType = SupplierType.NONE;
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    public async getIncomePerVatType(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.vatType = undefined;
        criteria.transactionType = [TransactionType.INCOME];
        criteria.paymentType = [PaymentType.NONE];
        criteria.supplierType = SupplierType.NONE;
        const query = await this.createPerVatTypeQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        const values: Record<VAT, number> = {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
        };
        const rs = await query.getRawMany();
        rs.forEach((totalAndVat) => {
            values[totalAndVat.vat] = +totalAndVat.total;
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
        criteria.supplierType = SupplierType.NONE;
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
        criteria.supplierType = SupplierType.NONE;
        const query = await this.createPerVatTypeQuery(
            criteria,
            dateFrom,
            dateTo,
        );
        const values: Record<VAT, number> = {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
        };
        const rs = await query.getRawMany();
        rs.forEach((totalAndVat) => {
            values[totalAndVat.vat] = +totalAndVat.total;
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
        const values: Record<
            PaymentType.CASH | PaymentType.ON_ACCOUNT,
            number
        > = { '0': 0, '2': 0 };

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
        const values: Record<PaymentType.CASH | PaymentType.BANK, number> = {
            '0': 0,
            '1': 0,
        };
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
        const values: Record<
            PaymentType.CASH | PaymentType.ON_ACCOUNT,
            number
        > = { '0': 0, '2': 0 };
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
        const values: Record<PaymentType.CASH | PaymentType.BANK, number> = {
            '0': 0,
            '1': 0,
        };
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
        const values: Record<TransactionType, number> = {
            '0': 0,
            '1': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
            '14': 0,
            '15': 0,
            '16': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
        };
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
        criteria.supplierType = SupplierType.NONE;
        console.log(criteria);
        console.log(dateFrom);
        console.log(dateTo);
        return this.createAndExecuteCriteriaQuery(criteria, dateFrom, dateTo);
    }

    private async getAllOperatingExpensesByDateRange(
        criteria: CriteriaDto,
        dateFrom: string,
    ) {
        criteria.vatType = undefined;
        criteria.paymentType = [PaymentType.CASH, PaymentType.BANK];
        criteria.supplierType = SupplierType.NONE;
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

    private async getWeeklyIncome(criteria: CriteriaDto, dateFrom: string) {
        const weekRanges = this.calculateWeekRangesByMonth(
            dateFrom.split('-')[0],
            dateFrom.split('-')[1],
        );
        const resultSet = {};
        for (const week of weekRanges) {
            const totalCashAndPos = await this.getTotalIncome(
                criteria,
                week.dateFrom,
                week.dateTo,
            );
            resultSet[week.dateFrom] = {
                totalCashAndPos: totalCashAndPos,
                dailyAverage: totalCashAndPos / week.days,
            };
        }
        return resultSet;
    }

    private calculateWeekRangesByMonth(year: string, month: string) {
        const daysInMonth = this.getDaysInMonth(year, month);
        if (daysInMonth == 28) {
            return [
                {
                    dateFrom: year + '-' + month + '-01',
                    dateTo: year + '-' + month + '-07',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-08',
                    dateTo: year + '-' + month + '-14',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-15',
                    dateTo: year + '-' + month + '-21',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-22',
                    dateTo: year + '-' + month + '-28',
                    days: 7,
                },
            ];
        } else if (daysInMonth == 29) {
            return [
                {
                    dateFrom: year + '-' + month + '-01',
                    dateTo: year + '-' + month + '-07',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-08',
                    dateTo: year + '-' + month + '-14',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-15',
                    dateTo: year + '-' + month + '-22',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-23',
                    dateTo: year + '-' + month + '-29',
                    days: 8,
                },
            ];
        } else if (daysInMonth == 30) {
            return [
                {
                    dateFrom: year + '-' + month + '-01',
                    dateTo: year + '-' + month + '-07',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-08',
                    dateTo: year + '-' + month + '-14',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-15',
                    dateTo: year + '-' + month + '-22',
                    days: 8,
                },
                {
                    dateFrom: year + '-' + month + '-23',
                    dateTo: year + '-' + month + '-30',
                    days: 8,
                },
            ];
        } else if (daysInMonth == 31) {
            return [
                {
                    dateFrom: year + '-' + month + '-01',
                    dateTo: year + '-' + month + '-07',
                    days: 7,
                },
                {
                    dateFrom: year + '-' + month + '-08',
                    dateTo: year + '-' + month + '-15',
                    days: 8,
                },
                {
                    dateFrom: year + '-' + month + '-16',
                    dateTo: year + '-' + month + '-23',
                    days: 8,
                },
                {
                    dateFrom: year + '-' + month + '-24',
                    dateTo: year + '-' + month + '-31',
                    days: 8,
                },
            ];
        }
    }

    private getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    private async getThreeMonthPeriodVat(
        criteria: CriteriaDto,
        dateFrom: string,
    ) {
        const period = this.getThreeMonthPeriod(
            Number(dateFrom.split('-')[0]),
            Number(dateFrom.split('-')[1]),
        );
        const incomePerVat = await this.getIncomePerVatType(
            criteria,
            period[0],
            period[1],
        );
        const outcomePerVat = await this.getOutcomePerVatType(
            criteria,
            period[0],
            period[1],
        );
        return (
            (incomePerVat['2'] / 1.06 - outcomePerVat['2'] / 1.06) * 0.06 +
            (incomePerVat['3'] / 1.13 - outcomePerVat['3'] / 1.13) * 0.13 +
            (incomePerVat['4'] / 1.24 - outcomePerVat['4'] / 1.24) * 0.24
        );
    }

    private getThreeMonthPeriod(year: number, month: number) {
        if ([1, 2, 3].includes(month)) {
            return [year + '-01-01', year + '-03-31'];
        } else if ([4, 5, 6].includes(month)) {
            return [year + '-04-01', year + '-06-30'];
        } else if ([7, 8, 9].includes(month)) {
            return [year + '-07-01', year + '-09-30'];
        } else if ([10, 11, 12].includes(month)) {
            return [year + '-10-01', year + '-12-31'];
        }
    }

    private async getTotalPrescriptions(
        criteria: CriteriaDto,
        dateFrom: string,
        dateTo: string,
    ) {
        criteria.date = dateFrom;
        criteria.range = RangeType.MONTHLY;
        const rs = await this.prescriptionService.getAllByCriteria(criteria);
        let total = 0;
        rs.forEach((prescription) => {
            total += +prescription.amount;
        });
        return total;
    }

    private async getAllTaxesByDateRange(
        criteria: CriteriaDto,
        dateFrom: string,
    ) {
        criteria.vatType = undefined;
        criteria.paymentType = [PaymentType.CASH, PaymentType.BANK];
        criteria.supplierType = SupplierType.NONE;
        const transactions =
            await this.transactionService.getAllTaxesByDateRange(
                criteria,
                dateFrom,
            );
        const taxes: Partial<Record<TransactionType, Transaction[]>> = {};

        transactions.forEach((transaction) => {
            if (taxes[transaction.transactionType] == undefined) {
                taxes[transaction.transactionType] = [];
            }
            taxes[transaction.transactionType].push(transaction);
        });

        return taxes;
    }
}

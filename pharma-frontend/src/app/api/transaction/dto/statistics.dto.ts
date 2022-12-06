import {PaymentType, TransactionType, VAT} from '../enums';
import {TransactionEntity} from '../transaction.entity';

export class StatisticsDto {
    [key: string]: {
        incomePerVat: Partial<Record<VAT, number>>;
        outcomePerVat: Partial<Record<VAT, number>>;
        totalCash: number;
        totalPos: number;
        totalExtra: number;
        totalEOPPYOnAccount: Partial<
            Record<VAT.SIX | VAT.THIRTEEN, number>
            >;
        totalEOPPYIncome: Partial<
            Record<VAT.SIX | VAT.THIRTEEN, number>
            >;
        totalOnAccount: number;
        totalPreviousMonths: number;
        totalIncome: number;
        threeMonthPeriodVat: number;
        totalPrescriptions: number;
        suppliers: {
            mainSupplier: {
                outcome: Partial<
                    Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
                    >;
                payment: Partial<Record<PaymentType.CASH, number>>;
            };
            otherSuppliers: {
                outcome: Partial<
                    Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
                    >;
                payment: Partial<Record<PaymentType.CASH, number>>;
            };
        };
        operatingExpenses: Partial<Record<TransactionType, number>>;
        taxes: Partial<Record<TransactionType, number>>;
        exchange: number;
        other: Partial<Record<TransactionType, number>>;
        weeklyIncome: {
            [key: string]: {
                totalCashAndPos: number;
                dailyAverage: number;
            };
        };
    };
}

import {
    PaymentType,
    Transaction,
    TransactionType,
    VAT,
} from '../../transaction';

export class StatisticsDto {
    [key: string]: {
        incomePerVat: Record<VAT, number>;
        outcomePerVat: Record<VAT, number>;
        totalCash: number;
        totalPos: number;
        totalExtra: number;
        totalEOPPYOnAccount: Record<VAT.SIX | VAT.THIRTEEN, number>;
        totalEOPPYIncome: Record<VAT.SIX | VAT.THIRTEEN, number>;
        totalOnAccount: number;
        totalPreviousMonths: number;
        totalIncome: number;
        threeMonthPeriodVat: number;
        totalPrescriptions: number;
        suppliers: {
            mainSupplier: {
                outcome: Record<
                    PaymentType.CASH | PaymentType.ON_ACCOUNT,
                    number
                >;
                payment: Record<PaymentType.CASH | PaymentType.BANK, number>;
            };
            otherSuppliers: {
                outcome: Record<
                    PaymentType.CASH | PaymentType.ON_ACCOUNT,
                    number
                >;
                payment: Record<PaymentType.CASH | PaymentType.BANK, number>;
            };
        };
        operatingExpenses: Partial<Record<TransactionType, Transaction[]>>;
        taxes: Partial<Record<TransactionType, Transaction[]>>;
        exchange: number;
        other: Record<TransactionType, number>;
        weeklyIncome: {
            [key: string]: {
                totalCashAndPos: number;
                dailyAverage: number;
            };
        };
    };
}

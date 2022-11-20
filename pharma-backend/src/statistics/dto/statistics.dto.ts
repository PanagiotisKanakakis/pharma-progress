import {
    PaymentType,
    Transaction,
    TransactionType,
    VAT,
} from '../../transaction';

export class StatisticsDto {
    [key: string]: {
        incomePerVat: Partial<Record<VAT, number>>;
        outcomePerVat: Partial<Record<VAT, number>>;
        totalCash: number;
        totalPos: number;
        totalExtra: number;
        totalEOPPYOnAccount: Partial<Record<VAT.SIX | VAT.THIRTEEN, number>>;
        totalEOPPYIncome: Partial<Record<VAT.SIX | VAT.THIRTEEN, number>>;
        totalOnAccount: number;
        totalPreviousMonths: number;
        totalIncome: number;
        suppliers: {
            mainSupplier: {
                outcome: Partial<
                    Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
                >;
                payment: Partial<
                    Record<PaymentType.CASH | PaymentType.BANK, number>
                >;
            };
            otherSuppliers: {
                outcome: Partial<
                    Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
                >;
                payment: Partial<
                    Record<PaymentType.CASH | PaymentType.BANK, number>
                >;
            };
        };
        operatingExpenses: Partial<Record<TransactionType, Transaction[]>>;
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

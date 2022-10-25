import {PaymentType, TransactionType, VAT} from '../enums';
import {TransactionEntity} from '../transaction.entity';

export class StatisticsDto {
    [key: string]: {
        incomePerVat: Partial<Record<VAT, number>>;
        outcomePerVat: Partial<Record<VAT, number>>;
        totalCash: number;
        totalPos: number;
        totalEOPPYOnAccount: number;
        totalEOPPYIncome: number;
        totalOnAccount: number;
        totalPreviousMonths: number;
        totalIncome: number;
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
        exchange: number;
        other: Partial<Record<TransactionType, number>>;
    };
}

export class CriteriaDto {
    userId: string;
    dateFrom?: string;
    dateTo?: string;
    transactionType?: number[];
    paymentType?: number[];
    supplierType?: number;
}


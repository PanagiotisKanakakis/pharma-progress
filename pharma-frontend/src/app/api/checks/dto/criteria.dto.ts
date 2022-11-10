export class CriteriaDto {
    userId: string;
    date: string;
    range: string;
    transactionType?: number[];
    paymentType?: number[];
    supplierType?: number;
}

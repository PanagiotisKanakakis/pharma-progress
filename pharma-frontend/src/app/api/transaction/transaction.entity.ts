export class TransactionEntity {
  public id: number;
  public transactionType: number;
  public vat: number;
  public paymentType: number;
  public createdAt: string;
  public cost: number;
  public comment: string;
  public supplierType: number;
  public userId: number;
}

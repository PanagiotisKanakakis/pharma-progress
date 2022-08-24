import { PaymentType } from '../enums';

export class OutcomeSupplierAnalysisDto {
    mainSupplier: Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>;
    otherSuppliers: Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>;
}

import { PaymentType } from '../enums';

export class OutcomeSupplierAnalysisDto {
    mainSupplier: Partial<
        Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
    >;
    otherSuppliers: Partial<
        Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
    >;
}

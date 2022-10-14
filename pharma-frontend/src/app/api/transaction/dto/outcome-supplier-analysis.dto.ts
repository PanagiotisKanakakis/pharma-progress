import { PaymentType } from '../../transaction/enums';

export class OutcomeSupplierAnalysisDto {
    mainSupplier: Partial<
        Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
    >;
    otherSuppliers: Partial<
        Record<PaymentType.CASH | PaymentType.ON_ACCOUNT, number>
    >;
}

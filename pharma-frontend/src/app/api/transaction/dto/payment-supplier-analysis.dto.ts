import { PaymentType } from '../../transaction';

export class PaymentSupplierAnalysisDto {
    mainSupplier: Partial<Record<PaymentType.CASH, number>>;
    otherSuppliers: Partial<Record<PaymentType.CASH, number>>;
}

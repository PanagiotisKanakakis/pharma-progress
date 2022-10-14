import { OutcomeSupplierAnalysisDto } from './outcome-supplier-analysis.dto';
import { VAT } from '../../transaction/enums';

export class OutcomeAnalysisDto {
    outcomePerVat: Partial<Record<VAT, number>>;
    suppliers: OutcomeSupplierAnalysisDto;
    exchange: number;
}

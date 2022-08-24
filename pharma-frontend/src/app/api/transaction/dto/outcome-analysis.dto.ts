import { OutcomeSupplierAnalysisDto } from './outcome-supplier-analysis.dto';
import { VAT } from '../enums';

export class OutcomeAnalysisDto {
    outcomePerVat: Record<VAT, number>;
    suppliers: OutcomeSupplierAnalysisDto;
    exchange: number;
}

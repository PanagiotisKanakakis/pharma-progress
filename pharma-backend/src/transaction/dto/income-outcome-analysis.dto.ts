import { IncomeAnalysisDto } from './income-analysis.dto';
import { OutcomeAnalysisDto } from './outcome-analysis.dto';
import { TransactionType } from '../enums';

export class IncomeOutcomeAnalysisDto {
    income: IncomeAnalysisDto;
    outcome: OutcomeAnalysisDto;
    other: Partial<Record<TransactionType, number>>;
}

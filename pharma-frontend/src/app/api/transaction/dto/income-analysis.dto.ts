import { VAT } from '../enums';

export class IncomeAnalysisDto {
    incomePerVat: Record<VAT, number>;
    totalCash: number;
    totalPos: number;
    totalEOPPY: number;
    totalOnAccount: number;
    totalPreviousMonths: number;
    totalIncome: number;
}

import { api } from "./client";

export type OcrStatus = "WAITING_UPLOAD" | "PROCESSING" | "DONE" | "FAILED";

export type OcrCompany = {
  companyId: number;
  salary: number;
};

export type OcrYearData = {
  caseYear: number;
  url: string;

  totalSalary: number;
  earnedIncomeDeductionAmount: number;
  earnedIncomeAmount: number;

  basicDeductionSelfAmount: number;
  basicDeductionSpouseAmount: number;
  basicDeductionDependentsAmount: number;

  nationalPensionDeductionAmount: number;
  totalSpecialIncomeDeductionTotalAmount: number;
  adjustedIncomeAmount: number;

  otherIncomeDeductionTotalAmount: number;
  otherIncomeDeductionExtra: number;

  taxBaseAmount: number;
  calculatedTaxAmount: number;

  taxReductionTotalAmount: number;

  earnedIncomeTotalAmount: number; // (Swagger 이름이 애매하지만 일단 그대로 사용)

  eligibleChildrenCount: number;
  childbirthAdoptionCount: number;

  donationTotalAmount: number;
  standardTaxCredit: number;

  monthlyRentTaxCreditAmount: number;
  totalTaxCreditAmount: number;

  determinedTaxAmountOrigin: number;

  companies: OcrCompany[];
};

export type GetCaseOcrResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    status: OcrStatus;
    errorCode?: string | null;
    errorMessage?: string | null;
    data: OcrYearData[] | null;
  };
};

export async function getCaseOcr(caseId: number) {
  const { data } = await api.get<GetCaseOcrResponse>(`/cases/${caseId}/ocr`);
  return data;
}
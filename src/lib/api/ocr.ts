import { api } from "./client";

export type OcrStatus = "WAITING_UPLOAD" | "PROCESSING" | "READY" | "FAILED" | "DONE";

/* =========================
   Types
========================= */

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

  earnedIncomeTotalAmount: number;

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

/* =========================
   Presign / Complete
========================= */

export type OcrPresignResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    uploadUrl: string;
    s3Key: string;
    expiresIn: number;
  };
};

export async function postOcrPresign(caseId: number) {
  const { data } = await api.post<OcrPresignResponse>(`/cases/${caseId}/ocr/presign`);
  return data;
}

export type OcrUploadCompleteResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    s3Key: string;
    contentLength: number | null;
    eTag: string | null;
    serverSideEncryption: string | null;
    status: OcrStatus;
    errorCode: string | null;
    errorMessage: string | null;
  };
};

export async function postOcrComplete(caseId: number) {
  const { data } = await api.post<OcrUploadCompleteResponse>(`/cases/${caseId}/ocr/complete`);
  return data;
}

/* =========================
   PATCH OCR (기존)
========================= */

export type PatchCaseOcrRequest = {
  OCRData: Array<{
    case_year: number;
    total_salary: number;
    earned_income_deduction_amount: number;
    earned_income_amount: number;
    basic_deduction_self_amount: number;
    basic_deduction_spouse_amount: number;
    basic_deduction_dependents_amount: number;
    national_pension_deduction_amount: number;
    total_special_income_deduction_amount: number;
    adjusted_income_amount: number;
    other_income_deduction_total_amount: number;
    other_income_deduction_extra: number;
    tax_base_amount: number;
    calculated_tax_amount: number;
    tax_reduction_total_amount: number;
    earned_income_total_amount: number;
    eligible_children_count: number;
    childbirth_adoption_count: number;
    donation_total_amount: number;
    standard_tax_credit: number;
    monthly_rent_tax_credit_amount: number;
    total_tax_credit_amount: number;
    determined_tax_amount: number;
  }>;
};

export type PatchCaseOcrResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
};

export async function patchCaseOcr(caseId: number, body: PatchCaseOcrRequest) {
  const { data } = await api.patch<PatchCaseOcrResponse>(`/cases/${caseId}/ocr`, body);
  return data;
}

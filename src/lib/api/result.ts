import { api } from "./client";

export type Scenario = {
  scenario_code: string;
  tax_difference_amount: number;
  determined_tax_amount: number;
  tax_base_amount: number;
  calculated_tax: number;
  earned_income_amount: number;
  refund_amount: number;
  scenario_text: string;
};

export type RefundResultByYear = {
  case_year: number;
  scenarios: Scenario[];
};

export type GetResultResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    refund_results: RefundResultByYear[];
  };
};

export async function getCalculationResult(caseId: number) {
  const res = await api.get<GetResultResponse>(`/result/${caseId}`);
  return res.data;
}
import { api } from "./client";

/** GET /api/result/{caseId} 응답에 들어오는 시나리오 */
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

/** POST /api/result/{caseId} Request Body */
export type SubmitScenarioItem = {
  case_year: number;
  scenario_code: string;
};

export type SubmitResultRequest = {
  scenarios: SubmitScenarioItem[];
};

/** POST /api/result/{caseId} Response */
export type SubmitResultResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    case_id: number;
  };
};

export async function postCalculationResult(
  caseId: number,
  payload: SubmitResultRequest
) {
  const res = await api.post<SubmitResultResponse>(`/result/${caseId}`, payload);
  return res.data;
}
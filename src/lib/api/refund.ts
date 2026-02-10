import { api } from "./client";

export type RefundSelectionRequest = {
  claim_from: number;        // 연도 (예: 2023)
  claim_to: number;          // 연도 (예: 2025)
  reduction_start: string;   // "YYYY-MM-DD" or ""
  reduction_end: string;     // "YYYY-MM-DD" or ""
  claim_date: string;        // "YYYY-MM-DD"
};

export type RefundSelectionResult = {
  case_id: number;
};

export type RefundSelectionResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: RefundSelectionResult;
};

export async function refundSelection(
  customerId: number | string,
  body: RefundSelectionRequest
) {
  const res = await api.post<RefundSelectionResponse>(
    `/refund-selection/${customerId}`,
    body
  );
  return res.data;
}
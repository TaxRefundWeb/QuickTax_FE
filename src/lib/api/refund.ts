import { api } from "./client";

export type RefundSelectionRequest = {
  claim_from: string;        // "YYYY-MM-DD"
  claim_to: string;          // "YYYY-MM-DD"
  claim_date: string;        // "YYYY-MM-DD"
  reduction_yn: "yes" | "no";
  reduction_start: string;   // "YYYY-MM-DD" or ""
  reduction_end: string;     // "YYYY-MM-DD" or ""
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
import { api } from "./client";

export type RefundSelectionRequest = {
  claim_from: string;
  claim_to: string;
};

export type RefundSelectionResult = {
  totalPageCount: number;
  validYears: number[];
  message?: string;
};

export type RefundSelectionResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: RefundSelectionResult;
};

export async function refundSelection(body: RefundSelectionRequest) {
  const res = await api.post<RefundSelectionResponse>("/refund-selection", body);
  return res.data;
}

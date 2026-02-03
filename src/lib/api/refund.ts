import { api } from "./client";

export type RefundSelectionRequest = {
  claim_from: string; // 예: "2020-01-01" 또는 백이 원하는 포맷
  claim_to: string;   // 예: "2024-12-31"
};

export async function refundSelection(body: RefundSelectionRequest) {
  const res = await api.post("/refund-selection", body);
  return res.data;
}

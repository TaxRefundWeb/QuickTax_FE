import { api } from "./client";

export type RefundClaimChild = {
  child_yn: string;     // "yes" | "no" (실제로는 yes만 보내게 됨)
  child_name: string;
  child_RRN: string;
};

export type RefundClaimCustomerRow = {
  Business_number: string;
  small_business_yn: string; // "yes" | "no"
  case_work_start: string;   // "YYYY-MM-DD"
  case_work_end: string;     // "YYYY-MM-DD"
  claim_date: string;        // "YYYY-MM-DD"
  reduction_start: string;   // "YYYY-MM-DD" (연도선택이면 변환해서 보냄)
  reduction_end: string;     // "YYYY-MM-DD"
  spouse_yn: string;         // "yes" | "no"
  spouse_name: string;
  spouse_RRN: string;
  child_list: RefundClaimChild[];
};

export type CreateRefundClaimPayload = {
  customerid: number;
  case_year: number[];
  customers: RefundClaimCustomerRow[];
};

export type CreateRefundClaimResponse = unknown;

export async function createRefundClaim(payload: CreateRefundClaimPayload) {
  const res = await api.post<CreateRefundClaimResponse>(
    "/api/refund-claims",
    payload
  );
  return res.data;
}

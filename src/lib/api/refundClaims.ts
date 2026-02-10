import { api } from "./client";

export type RefundClaimV2Company = {
  business_number: string;
  case_work_start: string;
  case_work_end: string;
  small_business_yn: boolean;
};

export type RefundClaimV2Spouse = {
  spouse_name: string;
  spouse_rrn: string;
};

export type RefundClaimV2Child = {
  child_name: string;
  child_rrn: string;
};

export type RefundClaimV2Case = {
  case_year: number;
  spouse_yn: boolean;
  child_yn: boolean;
  reduction_yn: boolean;
  companies: RefundClaimV2Company[];

  spouse?: RefundClaimV2Spouse;
  children?: RefundClaimV2Child[];
};

export type CreateRefundClaimV2Payload = {
  cases: RefundClaimV2Case[];
};

export type CreateRefundClaimV2Response = {
  isSuccess: boolean;
  code: string;
  message: string;
  result?: {
    saved_case_years: number[];
  };
};

export async function createRefundClaim(
  caseId: number,
  payload: CreateRefundClaimV2Payload
) {
  const res = await api.post<CreateRefundClaimV2Response>(
    `/refund-claims/${caseId}`,
    payload
  );
  return res.data;
}
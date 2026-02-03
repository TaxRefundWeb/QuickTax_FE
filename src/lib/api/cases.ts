import { api } from "./client";

export type CreateCasePayload = {
  customerid: number;
  case_year: number[];
  customers: Array<{
    Business_number: string;
    small_business_yn: string;
    case_work_start: string;
    case_work_end: string;
    claim_date: string;
    reduction_start: string;
    reduction_end: string;
    spouse_yn: string;
    spouse_name: string;
    spouse_RRN: string;
    child_list: Array<{
      child_yn: string;
      child_name: string;
      child_RRN: string;
    }>;
  }>;
};

export async function createCase(payload: CreateCasePayload) {
  const res = await api.post("/api/case", payload);
  return res.data;
}

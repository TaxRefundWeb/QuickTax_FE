import { api } from "./client";

export type Customer = {
  customerId: number;
  name: string;
  rrn?: string;
  birthdate?: string;
};

export type CreateCustomerRequest = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  bank_number: string;
  nationality_code: string;
  nationality_name: string;
  final_fee_percent: number;
};

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export type ApiResponse<T> = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
};

/**
 * 고객 목록 조회
 * GET /api/customers
 */
export async function getCustomers() {
  const res = await api.get("/customers");
  return res.data;
}

/**
 * 신규 고객 등록
 * POST /api/customers/new
 */
export async function createCustomer(
  body: CreateCustomerRequest
): Promise<ApiResponse<number>> {
  const res = await api.post<ApiResponse<number>>("/customers/new", body);
  return res.data;
}

/**
 * 특정 고객 조회
 * GET /api/customers/{customerId}
 */
export async function getCustomer(customerId: number) {
  const res = await api.get(`/customers/${customerId}`);
  return res.data;
}

/**
 * 고객 기본정보 수정
 * PATCH /api/customers/{customerId}
 */
export type PatchCustomerPayload = {
  name: string;
  rrn: string;
  phone: string;
  address: string;
  bank: string;
  bank_number: string;
  nationality_code: string;
  nationality_name: string;
  final_fee_percent: number;
};

export async function patchCustomer(customerId: number, body: PatchCustomerPayload) {
  const res = await api.patch(`/customers/${customerId}`, body);
  return res.data;
}

/**
 * 고객 이전 기록 조회
 * GET /api/customers/{customerId}/past
 */
export async function getCustomerPast(customerId: number) {
  const res = await api.get(`/customers/${customerId}/past`);
  return res.data;
}

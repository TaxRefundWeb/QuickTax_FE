import { api } from "./client";

export type Customer = {
  customerId: string; // or id
  name: string;
  rrn?: string; // 주민번호(마스킹?) - 실제 필드명은 백에 맞추기
  // 필요한 필드 계속 추가
};

export type CreateCustomerRequest = {
  name: string;
  rrn: string;
  // 기타 기본정보
};

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

// 고객 목록
export async function getCustomers() {
  const res = await api.get("/customers");
  return res.data;
}

// 신규 고객 생성
export async function createCustomer(body: CreateCustomerRequest) {
  const res = await api.post("/customers", body);
  return res.data;
}

// 특정 고객 조회
export async function getCustomer(customerId: string) {
  const res = await api.get(`/customers/${customerId}`);
  return res.data;
}

// 고객 기본정보 수정
export async function updateCustomer(customerId: string, body: UpdateCustomerRequest) {
  const res = await api.patch(`/customers/${customerId}`, body);
  return res.data;
}

// 고객 경정청구 목록 조회
export async function getCustomerCases(customerId: string) {
  const res = await api.get(`/customers/${customerId}/cases`);
  return res.data;
}

// 고객 새 경정청구 생성
export async function createCustomerCase(customerId: string, body: any) {
  const res = await api.post(`/customers/${customerId}/cases`, body);
  return res.data;
}

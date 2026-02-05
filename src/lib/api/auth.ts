import { api } from "./client";

export type LoginResponse = unknown; // 백엔드가 ApiResponse<String> 형태라면 필요시 타입 정의 가능

export async function login(cpaId: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", {
    cpaId,
    password,
  });
  return res.data;
}

export type LogoutResponse = {
  isSuccess: boolean;
  code: string;
  message: string;
  result: string;
};

export async function logout() {
  const res = await api.post<LogoutResponse>("/auth/logout");
  return res.data;
}
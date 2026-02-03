import { api } from "./client";

export type LoginResponse = unknown; // 백엔드가 ApiResponse<String> 형태라면 필요시 타입 정의 가능

export async function login(cpaId: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", {
    cpaId,
    password,
  });
  return res.data;
}

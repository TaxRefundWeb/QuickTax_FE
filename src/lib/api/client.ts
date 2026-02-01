import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // 쿠키 기반 인증이면 켜야 함 (JWT면 보통 필요 없음)
  // withCredentials: true,
});

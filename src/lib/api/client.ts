import axios from "axios";

export const api = axios.create({
  // vite proxy를 쓰면 baseURL 필요 없음 (/api로 시작하면 됨)
  withCredentials: true, // ⭐ 쿠키( accessToken ) 받기/보내기 필수
  headers: {
    "Content-Type": "application/json",
  },
});

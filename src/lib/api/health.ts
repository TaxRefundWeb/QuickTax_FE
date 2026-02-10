import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const checkHealth = async () => {
  const res = await axios.get<string>(`${BASE_URL}/health`, {
    withCredentials: true,
  });
  return res.data;
};
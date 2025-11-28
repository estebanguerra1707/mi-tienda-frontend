// ESTA ES LA URL PURA DEL SERVIDOR
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ESTA ES TU INSTANCIA DE AXIOS
import axios from "axios";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptors:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("jwt");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

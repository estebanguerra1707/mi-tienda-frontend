// ======================================================================
//   API BASE URL
// ======================================================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { queryClient } from "@/lib/queryClient";


import axios, { type InternalAxiosRequestConfig } from "axios";

// ======================================================================
//   TIPOS
// ======================================================================

// Cola de peticiones fallidas mientras se refresca el token
interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

// AxiosRequestConfig extendido con el flag `_retry`
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ======================================================================
//   HELPERS PARA TOKENS
// ======================================================================

function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

function setAccessToken(token: string): void {
  localStorage.setItem("accessToken", token);
}

function clearAuthData(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

// ======================================================================
//   INSTANCIA PRINCIPAL DE AXIOS
// ======================================================================

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// ======================================================================
//   1️⃣ INTERCEPTOR DE REQUEST  → manda accessToken automáticamente
// ======================================================================

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================================
//   2️⃣ INTERCEPTOR DE RESPONSE → refresh automático
// ======================================================================

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;
    const status = error.response?.status;

    // Si NO es 401 o ya intentamos refresh antes → nada que hacer
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Marcamos que este request ya se reintentó
    originalRequest._retry = true;

    // Si YA hay un refresh en progreso → agregamos la petición a la cola
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    // Si llegamos aquí, este request inicia un refresh
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();

      // Si no hay refresh token → logout directo
      if (!refreshToken) {
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Llamamos al backend para renovar el access token
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken: string = res.data.accessToken;

      // Guardamos el nuevo token
      setAccessToken(newAccessToken);

      // Procesamos la cola de peticiones pausadas
      processQueue(null, newAccessToken);

      // Reintentamos la petición original
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

      return api(originalRequest);

    } catch (refreshError) {
      // Falló el refresh → deslogueamos
      processQueue(refreshError, null);
      clearAuthData();
        queryClient.clear();
       window.location.href = "/login?reason=session_expired";
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

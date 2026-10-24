// ======================================================================
//   API BASE URL
// ======================================================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { queryClient } from "@/lib/queryClient";

import axios, { type InternalAxiosRequestConfig } from "axios";

// ======================================================================
//   TIPOS
// ======================================================================

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _mutationKey?: string; // 🔒 Para rastrear y liberar el candado anti-doble clic
}

// ======================================================================
//   🟢 SISTEMA DE LOADING GLOBAL Y CANDADO ANTI-DOBLE CLIC
// ======================================================================

let activeRequests = 0;
const pendingMutations = new Set<string>(); // 🔒 Guarda las mutaciones en curso

const toggleLoading = (isLoading: boolean) => {
  window.dispatchEvent(new CustomEvent("globalLoading", { detail: isLoading }));
};

// Función inteligente para restar peticiones evitando el parpadeo
const finishRequest = (mutationKey?: string) => {
  if (mutationKey) {
    pendingMutations.delete(mutationKey);
  }

  activeRequests--;
  // Damos 50ms de gracia. Si hay un refresh token en progreso o peticiones
  // concurrentes, el contador subirá antes de que se ejecute el ocultamiento.
  setTimeout(() => {
    if (activeRequests <= 0) {
      activeRequests = 0; // Previene números negativos
      toggleLoading(false);
    }
  }, 50);
};

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
//   1️⃣ INTERCEPTOR DE REQUEST → manda accessToken y bloquea doble clic
// ======================================================================

api.interceptors.request.use(
  (config: RetryAxiosRequestConfig) => {
    const method = config.method?.toUpperCase() || "";
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const isSearchPost = config.url?.includes("/avanzado") || config.url?.includes("/refresh");

    // 🔒 SOLO BLOQUEAMOS PANTALLA Y DOBLE CLIC EN OPERACIONES DE GUARDADO/EDICIÓN/BORRADO
    if (isMutation && !isSearchPost && !config._retry) {
      const mutationKey = `${method}:${config.url}`;

      if (pendingMutations.has(mutationKey)) {
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort("Operación en curso, evitando duplicado.");
        return config;
      }

      pendingMutations.add(mutationKey);
      config._mutationKey = mutationKey;

      // 🟢 MOSTRAR LOADER GLOBAL SOLO EN MUTACIONES
      if (activeRequests === 0) {
        toggleLoading(true);
      }
      activeRequests++;
    }

    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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
  (response) => {
    const originalRequest = response.config as RetryAxiosRequestConfig;
    if (originalRequest?._mutationKey) {
      finishRequest(originalRequest._mutationKey);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as RetryAxiosRequestConfig;

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status !== 401 || originalRequest?._retry) {
      if (originalRequest?._mutationKey) {
        finishRequest(originalRequest._mutationKey);
      }
      return Promise.reject(error);
    }

    if (originalRequest?._mutationKey) {
      finishRequest(originalRequest._mutationKey);
    }

    originalRequest._retry = true;
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
    
    // 🟢 MANTENER EL LOADER ACTIVO DURANTE EL REFRESCO DEL TOKEN
    activeRequests++; 

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
      finishRequest(); // 🟢 SOLTAMOS EL LOADER DEL REFRESCO
    }
  }
);
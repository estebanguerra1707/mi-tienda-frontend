// src/lib/http.ts
import axios from 'axios';
import { toast } from 'react-hot-toast';

/** Si tu API expone /api/v1, déjalo así; si no, pon '' */
export const API_PREFIX = '' // '' si no tienes prefijo

export const TOKEN_KEY = "jwt";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // definido en .env.local
  timeout: 20_000,
  // withCredentials: true, // habilítalo sólo si usas cookies
})

/** REQUEST: inyecta JWT + headers de negocio */
http.interceptors.request.use((config) => {
 const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  const branchId = localStorage.getItem('branchId')
  const businessType = localStorage.getItem('businessType')

  if (token) config.headers.Authorization = `Bearer ${token}`
  if (branchId) config.headers['X-Branch-Id'] = branchId
  if (businessType) config.headers['X-Business-Type'] = businessType

  return config
})

/** RESPONSE: manejo centralizado de errores */
http.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Error desconocido';

      // 🔐 401 → Sesión inválida o expirada
      if (status === 401) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('rol');
        localStorage.removeItem('branchId');
        localStorage.removeItem('businessType');

        const current = window.location.pathname + window.location.search;
        const loginUrl = `/login?next=${encodeURIComponent(current)}`;
        if (window.location.pathname !== '/login') {
          window.location.replace(loginUrl);
        }
      }

      else if (status === 403) {
        console.warn('Acceso denegado (403)');
        toast.error('No tienes permisos para esta acción.');
      }
      else if (status >= 500) {
        console.error('Error interno del servidor:', error.response?.data);
        const backendMessage =
          error.response?.data?.message || 'Error inesperado en el servidor';
        toast.error(`Error 500: ${backendMessage}`);
      }
      else {
        console.warn(`Error ${status}:`, message);
        toast.error(`Error ${status}: ${message}`);
      }
      return Promise.reject(error);
    }


    console.error('Error no controlado:', error);
    toast.error('Ocurrió un error inesperado.');
    return Promise.reject(error);
  }
);

export default http;

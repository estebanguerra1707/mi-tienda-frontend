// src/auth/authService.ts
import { api } from "@/lib/api";
import { setAccessToken, setRefreshToken, clearAuthData } from "./tokenStorage";

export async function login(email: string, password: string) {
  const resp = await api.post(`auth/login`, { email, password });
  const data = resp.data;

  // 👉 Tokens nuevos
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);

  // 👉 Guarda el usuario (puedes añadir branchId, businessType si los regresa el backend)
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: data.id,
      username: data.username,
      email: data.email,
      rol: data.rol,
      branchId: data.branchId ?? null,
      businessType: data.businessType ?? null,
    })
  );

  return data;
}

export function logout() {
  clearAuthData();
  window.location.href = "/login";
}

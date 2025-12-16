import { api } from "@/lib/api";
import { setAccessToken, setRefreshToken, clearAuthData } from "./tokenStorage";
import { queryClient } from '@/lib/queryClient';
import { bc } from "@/lib/broadcast";
import { toastSuccess } from "@/lib/toastSuccess";

export async function login(email: string, password: string) {
  const resp = await api.post(`auth/login`, { email, password });
  const data = resp.data;

  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);

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

export function logout(manual: boolean = false) {
  clearAuthData();
  queryClient.clear();
  bc.postMessage("logout");

  if (manual) {
    toastSuccess("Sesión cerrada correctamente");
    window.location.href = "/login";
  } else {
    window.location.href = "/login?reason=session_expired";
  }
}
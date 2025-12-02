export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function setAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function setRefreshToken(token: string) {
  localStorage.setItem("refreshToken", token);
}

export function clearAuthData() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

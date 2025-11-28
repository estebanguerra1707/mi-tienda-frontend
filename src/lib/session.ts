// src/lib/session.ts
export const session = {
  set(token: string, role?: string) {
    localStorage.setItem('jwt', token)
    if (role) localStorage.setItem('role', role)
  },
  clear() {
    localStorage.removeItem('jwt')
    localStorage.removeItem('role')
    localStorage.removeItem('branchId')
    localStorage.removeItem('businessType')
  },
  isAuth(): boolean {
    return !!localStorage.getItem('jwt')
  },
}

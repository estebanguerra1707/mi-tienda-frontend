// src/auth/roles.ts
export type Role = 'ADMIN' | 'SUPER_ADMIN' | 'VENDOR' | string;

export function getRole(): Role | null {
  return (localStorage.getItem('rol')) as Role | null;
}

export function hasAnyRole(roles: Role[]): boolean {
  const r = getRole();
  return !!r && roles.includes(r);
}

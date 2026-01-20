import { api } from "@/lib/api";

export type Role = "ADMIN" | "SUPER_ADMIN" | "VENDOR";

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  rol: Role;
  branchId?: number | null;
  branchName?: string | null;
  active: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: Role;
  branchId?: number | null;
}
export interface UpdateUserDto {
  username?: string;
  email?: string;
  role?: Role;
  branchId?: number | null;

  // solo si cambia contraseña
  currentPassword?: string;
  newPassword?: string;
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/usuarios");
  return data;
}

export async function createUser(payload: CreateUserDto): Promise<User> {
  const { data } = await api.post<User>("/usuarios", payload);
  return data;
}

export async function updateUser(
  id: number | string,
  payload: UpdateUserDto
): Promise<User> {
  const { data } = await api.put<User>(`/usuarios/${id}`, payload);
  return data;
}

export async function deleteUser(id: number | string): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}

export async function getUserById(id: number | string): Promise<User> {
  const { data } = await api.get<User>(`/usuarios/${id}`);
  return data;
}


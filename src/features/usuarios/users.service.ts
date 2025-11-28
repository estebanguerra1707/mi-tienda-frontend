import http from "@/lib/http";

export type Role = "ADMIN" | "SUPER_ADMIN" | "VENDOR";

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
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

export type UpdateUserDto = Partial<Omit<CreateUserDto, "password">>;

export async function fetchUsers(): Promise<User[]> {
  const { data } = await http.get<User[]>("/usuarios");
  return data;
}

export async function createUser(payload: CreateUserDto): Promise<User> {
  const { data } = await http.post<User>("/usuarios", payload);
  return data;
}

export async function updateUser(
  id: number | string,
  payload: UpdateUserDto
): Promise<User> {
  const { data } = await http.put<User>(`/usuarios/${id}`, payload);
  return data;
}

export async function deleteUser(id: number | string): Promise<void> {
  await http.delete(`/usuarios/${id}`);
}

export async function getUserById(id: number | string): Promise<User> {
  const { data } = await http.get<User>(`/usuarios/${id}`);
  return data;
}


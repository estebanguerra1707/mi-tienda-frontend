import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type CreateUserDto,
  type UpdateUserDto,
  type User,
} from '@/features/usuarios/users.service';

export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
};

export function useUsers() {
  return useQuery<User[]>({
    queryKey: usersKeys.list(),
    queryFn: fetchUsers,
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserDto) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateUserDto }) =>
      updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

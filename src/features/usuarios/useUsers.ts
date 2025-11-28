import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchUsers, updateUser, type User, type UpdateUserDto } from "./users.service";

export const usersKeys = {
  all: ["users"] as const,
  list: () => [...usersKeys.all] as const,
  detail: (id: string | number) => ["user", String(id)] as const,
};

// ✅ Lista de usuarios
export function useUsers() {
  return useQuery<User[]>({
    queryKey: usersKeys.list(),
    queryFn: fetchUsers,
    staleTime: 30_000,
  });
}

// ✅ Mutación para actualizar usuario
export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UpdateUserDto;
    }): Promise<void> => {
      await updateUser(id, payload);
    },

    onSuccess: (_data, vars) => {
      // Invalidar lista y detalle
      qc.invalidateQueries({ queryKey: usersKeys.list() });
      qc.invalidateQueries({ queryKey: usersKeys.detail(vars.id) });

      toast.success("Usuario actualizado correctamente");
    },

    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("No se pudo actualizar el usuario");
      }
    },
  });
}

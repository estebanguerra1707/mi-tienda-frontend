// src/features/usuarios/useCreateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser, CreateUserDto, User } from "./users.service";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation<User, AxiosError<{ message: string }>, CreateUserDto>({
    mutationFn: (payload) => createUser(payload),
    onSuccess: () => {
      toast.success("Usuario creado correctamente");
      qc.invalidateQueries({ queryKey: ["users"] }); // refresca tabla
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message || "No se pudo crear el usuario";
      toast.error(msg);
    },
  });
}

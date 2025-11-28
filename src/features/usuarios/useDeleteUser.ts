import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "./users.service";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation<void, AxiosError<{ message: string }>, number>({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      toast.success("Usuario eliminado correctamente");
      qc.invalidateQueries({ queryKey: ["users"] }); // refresca la lista
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message || "No se pudo eliminar el usuario";
      toast.error(msg);
    },
  });
}

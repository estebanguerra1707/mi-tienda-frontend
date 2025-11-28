import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser, UpdateUserDto, User } from "./users.service";
import { toast } from "react-hot-toast";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserDto }) =>
      updateUser(id, payload),
    onSuccess: (data: User) => {
      toast.success(`Usuario "${data.username}" actualizado correctamente`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

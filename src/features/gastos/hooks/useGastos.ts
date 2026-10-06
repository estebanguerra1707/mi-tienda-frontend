import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gastosApi, GastoRequestDTO } from "../api/gastosApi";

export function useGastos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["gastos"],
    queryFn: gastosApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: gastosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GastoRequestDTO }) => gastosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: gastosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
    },
  });

  return {
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
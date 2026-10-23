import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gastosApi, GastoRequestDTO, SpringPage, GastoDTO } from "../api/gastosApi";

export function useGastos(page: number = 0, size: number = 10) {
  const queryClient = useQueryClient();

  const query = useQuery<SpringPage<GastoDTO>>({
    queryKey: ["gastos", page, size],
    queryFn: () => gastosApi.getAll(page, size),
    placeholderData: (previousData) => previousData, // Reemplazo moderno para keepPreviousData en TanStack Query v5
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
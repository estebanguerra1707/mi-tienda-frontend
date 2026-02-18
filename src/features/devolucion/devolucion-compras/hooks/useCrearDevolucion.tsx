import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import type { Devolucion } from "../types/Devolucion";

export interface Payload {
  compraId: number;
  detalleId: number;
  cantidad: number;
  motivo: string;
  codigoBarras: string;
  branchId: number;
}

interface BackendError {
  message: string;
}
type ErrorResponse = AxiosError<BackendError>;

export function useCrearDevolucion() {
  const queryClient = useQueryClient();

  return useMutation<Devolucion, ErrorResponse, Payload>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/compras/devolucion", payload);
      return data;
    },
    onSuccess: async () => {
      // ✅ Refresca inventario (y cualquier variante por filtro)
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });

      // (Opcional) si tienes pantallas que dependen de compras:
      await queryClient.invalidateQueries({ queryKey: ["compras"] });

      toast.success("Devolución registrada");
    },
    onError: (error) => {
      const msg = error.response?.data?.message ?? "Error en la devolución";
      toast.error(msg);
    },
  });
}

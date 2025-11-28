import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Devolucion } from "../types/Devolucion";

export interface Payload {
  compraId: number;
  detalleId: number;
  cantidad: number;
  motivo: string;
  codigoBarras:string;
  branchId:number;
}
interface BackendError {
  message: string;
}

type ErrorResponse = AxiosError<BackendError>;


export function useCrearDevolucion() {
  return useMutation<Devolucion, ErrorResponse, Payload>({
  mutationFn: async (payload) => {
    const { data } = await api.post('/compras/devolucion', payload);
    return data;
  },
  onError: (error) => {
    const msg = error.response?.data?.message ?? "Error en la devolución";
    toast.error(msg);
  },
});
}

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import type { DevolucionVenta } from "../types/DevolucionVenta";

export interface PayloadDevolucionVenta {
  ventaId: number;
  cantidad: number;
  codigoBarras: string;
  branchId: number;
  businessTypeId: number;
  sku: string;
  motivo: string;
}

interface BackendError {
  message: string;
}

type ErrorResponse = AxiosError<BackendError>;

export function useCrearDevolucionVenta() {
  return useMutation<DevolucionVenta, ErrorResponse, PayloadDevolucionVenta>({
    mutationFn: async (payload) => {
      const { data } = await api.post("/ventas/devolucion", payload);
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? "Error en la devolución");
    },
  });
}

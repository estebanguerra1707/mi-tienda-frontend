import { useMutation } from "@tanstack/react-query";
import { devolverVenta, devolverCompra } from "@/features/devolucion/devolucion-compras/devoluciones";
import {
  DevolucionVentaRequest,
  DevolucionVentaResponse,
  DevolucionCompraRequest,
  DevolucionCompraResponse,
} from "@/types/devoluciones";
import { toastError } from "@/lib/toast";
import { toastSuccess } from "@/lib/toastSuccess";

export function useDevolucionVentas() {
  return useMutation<DevolucionVentaResponse, Error, DevolucionVentaRequest>({
    mutationFn: devolverVenta,
    onSuccess: () => toastSuccess("Devolución de venta realizada"),
    onError: (e) => toastError(e.message),
  });
}

export function useDevolucionCompras() {
  return useMutation<DevolucionCompraResponse, Error, DevolucionCompraRequest>({
    mutationFn: devolverCompra,
    onSuccess: () => toastSuccess("Devolución de compra realizada"),
    onError: (e) => toastError(e.message),
  });
}

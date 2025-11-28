import type { DetalleVentaResponseDTO } from "@/features/devolucion/devolucion-ventas/types/DevolucionVenta";
import type { VentaDetalleItem } from "@/features/ventas/api";

export function mapVentaDetalleToDTO(
  d: VentaDetalleItem
): DetalleVentaResponseDTO {
  return {
    id: d.productId,
    productName: d.productName,
    quantity: d.quantity,
    unitPrice: d.unitPrice,
    subTotal: d.subTotal,
    codigoBarras: d.codigoBarras,
    sku: d.sku,
    branchId: d.branchId,
    branchName: d.branchName,
    businessTypeId: d.businessTypeId,
    businessTypeName: d.businessTypeName,
  };
}

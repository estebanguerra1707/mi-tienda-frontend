import type { DetalleVentaResponseDTO } from "@/features/devolucion/devolucion-ventas/types/DevolucionVenta";
import type { VentaDetalleItem } from "@/features/ventas/api";

export function mapVentaDetalleToDTO(d: VentaDetalleItem): DetalleVentaResponseDTO {
  return {
    id: typeof d.id === "number" ? d.id : Number(d.id ?? d.productId),

    productName: d.productName,
    codigoBarras: d.codigoBarras,
    sku: d.sku,

    quantity: d.quantity,
    unitPrice: d.unitPrice,
    subTotal: d.subTotal,

    branchId: d.branchId,
    branchName: d.branchName,
    businessTypeId: d.businessTypeId,
    businessTypeName: d.businessTypeName,
    unitAbbr: d.unitAbbr ?? null,
    unitName: d.unitName ?? null,
    permiteDecimales: (d as unknown as { permiteDecimales?: boolean | null }).permiteDecimales ?? null,

    inventarioOwnerType: d.inventarioOwnerType,
    usaInventarioPorDuenio: d.usaInventarioPorDuenio,
  };
}
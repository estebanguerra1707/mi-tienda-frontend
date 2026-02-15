export type InventarioOwnerType = "PROPIO" | "CONSIGNACION";
export interface DetalleVentaResponseDTO {
  id: number;
  productName: string;
  codigoBarras: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  branchId: number;
  branchName: string;
  businessTypeId: number;
  businessTypeName: string;
  unitAbbr?: string | null;
  unitName?: string | null;
  permiteDecimales?: boolean | null;
  inventarioOwnerType?: InventarioOwnerType;
  usaInventarioPorDuenio?:boolean;
}

export interface VentaItem {
  id: number;
  clientName: string;
  saleDate: string;
  paymentName: string;
  amountPaid: number;
  details: DetalleVentaResponseDTO[];
}

export interface DevolucionVenta {
  id: number;
  tipoDevolucion: string;
  totalDevolucion: number;
  fechaDevolucion: string;
}

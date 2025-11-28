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
  totalDevuelto: number;
  fechaDevolucion: string;
}

export interface DevolucionVentaRequest {
  ventaId: number;
  codigoBarras: string;
  cantidad: number;
  motivo: string;
}

export interface DevolucionCompraRequest {
  compraId: number;
  codigoBarras: string;
  cantidad: number;
  motivo: string;
}

export interface DetalleDevolucion {
  id: number;
  cantidadDevuelta: number;
  precioUnitario: number;
  productoId: number;
}

export interface DevolucionVentaResponse {
  id: number;
  tipoDevolucion: "TOTAL" | "PARCIAL";
  montoDevuelto: number;
  fechaDevolucion: string;
  ventaId: number;
  detalles: DetalleDevolucion[];
}

export interface DevolucionCompraResponse {
  id: number;
  tipoDevolucion: "TOTAL" | "PARCIAL";
  fechaDevolucion: string;
  compraId: number;
  detalles: DetalleDevolucion[];
}

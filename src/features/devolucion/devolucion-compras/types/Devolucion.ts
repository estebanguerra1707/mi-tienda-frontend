export interface Devolucion {
  id: number;
  compraId: number;
  fechaDevolucion: string;
  tipoDevolucion: string;
  sucursal: string;
  motivo: string;
  totalDevolucion: number;
  usuario: string;

  detalles: DetalleDevolucion[];
}

export interface DetalleDevolucion {
  productId: number;
  productName: string;
  precioCompra: number;
  cantidadDevuelta: number;
}

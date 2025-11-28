export interface DevolucionComprasItem {
  id: number;
  compraId: number;
  fechaDevolucion: string;
  montoDevuelto: string;
  tipoDevolucion: "TOTAL" | "PARCIAL";
  productName: string;
  codigoBarras: string;
  cantidadDevuelta: number;
  username: string;
  branchName: string;
}

export interface DevolucionComprasPage {
  content: DevolucionComprasItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DevolucionComprasFiltro {
  id?: string;
  compraId?: string;
  username?: string;
  codigoBarras?: string;
  tipoDevolucion?: string;
  startDate?: string;
  endDate?: string;
  day?: string;
  month?: string;
  year?: string;
  minMonto?: string;
  maxMonto?: string;
  minCantidad?: string;
  maxCantidad?: string;
  branchId?: string;
  page?: number;
  size?: number;
}

export interface FiltrosDevoluciones {
  id?: string;
  codigoBarras?: string;
  tipoDevolucion?: string;
  startDate?: string;
  endDate?: string;
  username?: string;
  compraId?: string;
  minMonto?: string;
  maxMonto?: string;
  minCantidad?: string;
  maxCantidad?: string;
  day?: string;
  month?: string;
  year?: string;
  page?: number;
}
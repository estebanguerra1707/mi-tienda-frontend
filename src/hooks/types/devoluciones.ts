export interface DevolucionFiltro {
  id?: number;
  ventaId?: number;
  username?: string;
  codigoBarras?: string;
  productName?: string;
  tipoDevolucion?: "TOTAL" | "PARCIAL";

  startDate?: string;
  endDate?: string;

  day?: number;
  month?: number;
  year?: number;

  minMonto?: number;
  maxMonto?: number;
  minCantidad?: number;
  maxCantidad?: number;

  branchId?: number;

  page?: number;
  size?: number;
}
export interface DevolucionItem {
  id: number;
  ventaId: number;
  fechaDevolucion: string;
  montoDevuelto: number;
  tipoDevolucion: string;
  username: string;
  productName: string;
  productCode: string;
  branchName: string;
  cantidadDevuelta:number;
  motivo: string;
}

export interface DevolucionPage {
 content: DevolucionItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

import { api } from "@/lib/api";
import type { Page } from "@/types/api";

export interface CompraDetalle {
  productId: number;
  quantity: number;
}

export interface CompraCreate {
  providerId: number;
  branchId: number;
  purchaseDate: string;
  paymentMethodId: number;
  amountPaid: number;
  changeAmount?: number; 
  amountInWords?: string;
  emailList: string[];
  isPrinted: boolean;
  barcode?: string;
  cashGiven?: number;
  details: CompraDetalle[];
}

export interface CompraItem {
  id: number;
  providerName: string;
  purchaseDate: string;
  totalAmount: number;
  details: DetalleCompraResponseDTO[];
  paymentMethodId: number;
  paymentName: string;
  amountPaid: number;
  changeAmount: number;
  amountInWords: string;
  userId: number;
  userName: string;

}


export interface DetalleCompraResponseDTO {
  id: number;
  productId: number;
  branchId:number;
  businessTypeId:number;
  businessTypeName:number;
  branchName:string;
  sku: string;
  codigoBarras: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface CompraSearchFiltro {
  supplierId?: number;
  start?: string;
  end?: string;
  min?: number;
  max?: number;
  day?: number;
  month?: number;
  year?: number;
  active?: boolean;
}

export type CompraPage = Page<CompraItem>;

// Query genéricas de lista
export type CompraListParams = {
  page?: number;  // 0-based
  size?: number;
  sort?: string;  // p.ej. "purchaseDate,desc"
};

// Parámetros del search (por fecha/proveedor)
export type CompraParams = {
  day?: number;
  month?: number;
  providerId?: number;
} & CompraListParams;


export async function fetchCompras(params?: CompraListParams): Promise<CompraPage> {
  const { data } = await api.get<CompraPage>("/compras", { params });
  return data;
}

export async function fetchCompraById(id: number) {
  const { data } = await api.get<CompraItem>(`/compras/${id}`);
  return data;
}

export async function createCompra(payload: CompraCreate) {
  const { data } = await api.post<CompraItem>("/compras", payload);
  return data;
}

export async function deleteCompra(id: number) {
  const { data } = await api.delete(`/compras/${id}`);
  return data;
}


export async function searchComprasPaginadas(params: {
  page?: number;
  size?: number;
  sort?: string;
} & CompraSearchFiltro): Promise<CompraPage> {
  
  const { page = 0, size = 10, sort, ...filtro } = params;

  const url = sort
    ? `/compras/search?page=${page}&size=${size}&sort=${sort}`
    : `/compras/search?page=${page}&size=${size}`;

  const res = await api.post(url, filtro);
  return res.data as CompraPage;
}

export async function devolucionCompra(payload: {
  compraId: number;
  codigoBarras: string;
  cantidad: number;
  motivo: string;
}) {
  const { data } = await api.post("/compras/devolucion", payload);
  return data;
}


export async function sendCompraTicketByEmail(compraId: number, emailList:string[]){
  return api.request({
    url: `/pdf-sender/compra/${compraId}`,
    method: "POST",
    headers: {"Content-Type":"application/json"},
    data: {emailList},
  });
}

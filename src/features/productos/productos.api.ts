import { api } from "@/lib/api";

export type PageResp<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;        // página actual (0-based)
  size: number;          // tamaño de página
  first: boolean;
  last: boolean;
};

export type Producto = {
  id: number;
  name: string;
  sku: string;
  description?: string;
  purchasePrice?: number;
  salePrice?: number;
  stock?: number;
  categoryId?: number | null;
  categoryName?: string;
  providerId?: number | null;
  providerName?: string;
  codigoBarras?: string;
  branchId?: number | null;
  creationDate?: string;
  businessTypeName?: string;
  active:boolean;
};

export type ProductoFiltroDTO = {
  active?: boolean;
  min?: number;
  max?: number;
  category?: string;
  available?: boolean;
  withoutCategory?: boolean;
  id?: number;
  categoryId?: number;
  branchId?: number;
  businessTypeId?: number;
  barcodeName?: string;
};

export interface ProductoDetailResponseDTO {
  id?: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  // agrega aquí los campos reales que tengas en tu DTO de detalle
}

export interface ProductoResponseDTO {
  id: number;
  name: string;
  sku: string;
  description: string;
  purchasePrice: number;
  salePrice: number;
  categoryId: number;
  categoryName: string;
  providerId: number;
  providerName: string;
  businessTypeId: number;
  businessTypeName: string;
  creationDate: string; // LocalDateTime → string en JSON
  productDetail?: ProductoDetailResponseDTO | null;
  codigoBarras: string;
  branchId: number;
  branchName: string;
  active: boolean;
}



export function buildFiltro(raw: ProductoFiltroDTO): ProductoFiltroDTO {
  // Creamos un objeto mutable con todas las claves de ProductoFiltroDTO
  const out = {} as Record<keyof ProductoFiltroDTO, ProductoFiltroDTO[keyof ProductoFiltroDTO]>;

  (Object.keys(raw) as (keyof ProductoFiltroDTO)[]).forEach((k) => {
    const v = raw[k];
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });

  return out as ProductoFiltroDTO;
}


export async function buscarProductosAvanzado(
  filtro: ProductoFiltroDTO,
  opts: { page?: number; size?: number; sort?: string[] } = {}
): Promise<PageResp<Producto>> {
  const { page = 0, size = 20, sort = [] } = opts;

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  sort.forEach((s) => params.append("sort", s));

  const body = buildFiltro(filtro);

  const { data } = await api.post<PageResp<Producto>>(
    `/productos/avanzado?${params.toString()}`,
    body
  );
  return data;
}
export type UnidadMedida = "PIEZA" | "KILOGRAMO" | "LITRO" | "METRO";
export interface ProductItem {
  id: number;
  name: string;
  sku: string;
  description: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  categoryId: number;
  categoryName: string;

  providerId: number;
  providerName: string;

  businessTypeId: number;
  businessTypeName: string;

  creationDate: string;

  codigoBarras: string;
  barcode?: string;
  active: boolean;
  permiteDecimales?: boolean;
 unidadMedidaId?: number | null;
  unidadMedidaAbreviatura?: string | null;
  unidadMedidaCodigo?: string | null;
  unidadMedidaNombre?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages?: number;
  totalElements?: number;
}
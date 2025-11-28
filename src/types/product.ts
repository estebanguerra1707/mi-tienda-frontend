// Tipos para productos
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

  codigoBarras: string; // 💡 nombre original del backend
  barcode?: string;     // alias opcional si lo usas en venta
  active: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalPages?: number;
  totalElements?: number;
}
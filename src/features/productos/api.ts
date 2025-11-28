// src/features/productos/api.ts
import http from '@/lib/http';
import { cleanParams } from '@/lib/http-params';

export type Product = {
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
  creationDate: string;
  codigoBarras: string;
};

export type BusinessType = {
  id: number;
  name: string;
};


export type ProductsQuery = Readonly<{
  barcodeName?: string;
  page: number;
  pageSize: number;
}>;

export type ProductsPage = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};


type SpringPage<T> = {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
};

export type CreateProductPayload = Omit<Product, 'id' | 'categoryName' | 'providerName' | 'businessTypeId' | 'businessTypeName' | 'creationDate'> & {
  branchId?: number;
};

type MaybePaged<T> = SpringPage<T> | T[];

// GET /productos
export async function fetchProducts(params: ProductsQuery): Promise<ProductsPage> {
  const springParams = cleanParams({
    q: params.barcodeName || undefined,
    page: Math.max(0, (params.page ?? 1) - 1),
    size: params.pageSize ?? 10,
    sort: 'name,asc',
  });

  const { data } = await http.get<MaybePaged<Product>>('/productos', { params: springParams });

  // ¿Backend devuelve array plano?
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      pageSize: data.length || (params.pageSize ?? 10),
    };
  }

  // Página de Spring -> nuestra shape
  return {
    items: data.content ?? [],
    total: data.totalElements ?? 0,
    page: (data.number ?? 0) + 1,
    pageSize: data.size ?? (data.content?.length ?? params.pageSize ?? 10),
  };
}

export async function createProduct(payload: Omit<Product, 'id'>): Promise<Product> {
  const { data } = await http.post<Product>('/productos', payload);
  return data;
}

export async function updateProduct(id: number | string, payload: Partial<Product>): Promise<Product> {
  const { data } = await http.put<Product>(`/productos/${id}`, payload);
  return data;
}

export async function deleteProduct(id: number | string): Promise<void> {
  await http.delete(`/productos/${id}`);
}

export async function fetchBusinessTypes(): Promise<BusinessType[]> {
  const { data } = await http.get<BusinessType[]>("/business-types");
  return data;
}
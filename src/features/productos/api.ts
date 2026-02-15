import { api } from '@/lib/api';
import { cleanParams } from '@/lib/http-params';
import { ProductoResponseDTO } from './productos.api';
export type UnidadMedida =
  | "PIEZA"
  | "KILOGRAMO"
  | "LITRO"
  | "METRO";

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
  unidadMedidaId: number;
  unidadMedida?: UnidadMedida;
  permiteDecimales: boolean;
};
export type UpdateProductPayload = {
  name: string;
  sku: string;
  codigoBarras: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  categoryId: number;
  providerId: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
   unidadMedidaId: number;
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

  const { data } = await api.get<MaybePaged<Product>>('/productos', { params: springParams });

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

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const { data } = await api.post<Product>('/productos', payload);
  return data;
}

export async function updateProduct(
  id: number | string,
  payload: UpdateProductPayload
): Promise<Product> {
  const { data } = await api.put<Product>(`/productos/${id}`, payload);
  return data;
}

export async function deleteProduct(id: number | string): Promise<void> {
  await api.delete(`/productos/${id}`);
}

export async function fetchBusinessTypes(): Promise<BusinessType[]> {
  const { data } = await api.get<BusinessType[]>("/business-types");
  return data;
}

export async function getProductByBarcode(codigoBarras: string): Promise<ProductoResponseDTO> {
  const { data } = await api.get(`/productos/codigo-barras/${codigoBarras}`);
  return data;
}
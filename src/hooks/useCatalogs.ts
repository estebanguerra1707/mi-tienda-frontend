import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchBusinessTypes, type BusinessType } from "@/features/productos/api";
import { api } from "@/lib/api";
/* ==== Tipos comunes ==== */
export type CatalogItem = { id: number; name: string };

export interface BranchItem {
  id: number;
  name: string;
  usaInventarioPorDuenio: boolean;
}
export type BranchInfo = {
  id: number;
  name: string;
  businessTypeId: number;
  usaInventarioPorDuenio?: boolean;
};

export interface PaymentMethod {
  id: number;
  name: string;
}
export type Sucursal = { id: number; name: string };

type RawAny = Record<string, unknown>; // para leer llaves con type-guard
/* ==== Tipos de apoyo para Page ==== */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}




const BASE = import.meta.env.VITE_API_BASE_URL;
const CATALOG_STALE_TIME = 15 * 24 * 60 * 60_000;
const CACHE_TIME = 30 * 24 * 60 * 60_000;
const ISRFEFECTHON = false;
if (!BASE) throw new Error("VITE_API_BASE_URL no está definido");

/* ==== Utilidades ==== */
function toCatalogArray(raw: unknown): CatalogItem[] {
  const arr: RawAny[] = Array.isArray(raw) ? raw : [];

  return arr
    .map((o) => {
      const id = Number((o.id ?? o.branchId ?? o.sucursalId) as number | string);
      const name = String(
        (o.name as string | undefined) ??
        (o.nombre as string | undefined) ??
        (o.nombreSucursal as string | undefined) ??
        ''
      ).trim();

      return Number.isFinite(id) && name ? { id, name } : undefined;
    })
    .filter((x): x is CatalogItem => Boolean(x));
}



async function getJsonUnknown<T = unknown>(url: string, token: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/* ==== Hooks de catálogos ==== */
export function useCategories(opts: {
  businessTypeId?: number | null;
  isSuper?: boolean;
  branchId?: number | null;
}) {
  const { token, isSuper: isSuperFromAuth, user } = useAuth();
  const isSuper = opts.isSuper ?? isSuperFromAuth;

  const ready = Boolean(token && (opts.isSuper !== undefined || user));

  return useQuery<CatalogItem[]>({
    queryKey: [
      "categories",
      isSuper ? "super" : "normal",
      opts.businessTypeId ?? null,
      opts.branchId ?? null,
    ],
    enabled: ready,
    queryFn: async () => {
      let url: string;

      if (isSuper) {
        if (opts.businessTypeId != null) {
          url = `/categorias/tipo-negocio/${opts.businessTypeId}`;
        } else {
          url = `/categorias`;
        }
      } else if (opts.branchId != null) {
        url = `/categorias/sucursal/${opts.branchId}`;
      } else if (opts.businessTypeId != null) {
        url = `/categorias/tipo-negocio/${opts.businessTypeId}`;
      } else {
        url = `/categorias/actual`;
      }

      const { data } = await api.get(url);
      return toCatalogArray(data);
    },
    staleTime: CATALOG_STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: ISRFEFECTHON,
    retry: 1,
  });
}

export function useProviders(opts: {
  businessTypeId?: number | null;
  branchId?: number | null;
  isSuper?: boolean;
}) {
  const { token } = useAuth();

  const canLoad =
    Boolean(token) &&
    (
      (opts.isSuper && opts.businessTypeId != null) ||
      (!opts.isSuper && opts.branchId != null)
    );

  const queryKey = [
  "providers",
  opts.isSuper ? "super" : "branch",
  opts.isSuper ? opts.businessTypeId : opts.branchId,
];

  return useQuery<CatalogItem[]>({
    queryKey,
    enabled: canLoad,
    queryFn: async () => {
      const url = opts.isSuper
        ? `/proveedores?businessTypeId=${opts.businessTypeId}`
        : `/proveedores?branchId=${opts.branchId}`;

      const { data } = await api.get(url);
      return toCatalogArray(data);
    },
    staleTime: CATALOG_STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: ISRFEFECTHON, 
  });
}


function toBranchArray(raw: unknown): BranchItem[] {
  const arr: RawAny[] = Array.isArray(raw) ? raw : [];

  return arr
    .map((o) => {
      const id = Number(o.id ?? o.branchId ?? o.sucursalId);
      const name = String(
        o.name ??
        o.nombre ??
        o.nombreSucursal ??
        ""
      ).trim();

      const usaInventarioPorDuenio  = Boolean(o.usaInventarioPorDuenio );

      return Number.isFinite(id) && name
        ? { id, name, usaInventarioPorDuenio  }
        : undefined;
    })
    .filter((x): x is BranchItem => Boolean(x));
}
/** Sucursales**/
export function useBranches(opts: {
  businessTypeId?: number | null;
  oneBranchId?: number | null;
  isSuper?: boolean;
}) {
  const { token, user, hasRole } = useAuth();
  const authReady = Boolean(token && user);

  const isSuper = opts.isSuper ?? hasRole("SUPER_ADMIN");

  return useQuery<BranchItem[]>({
    queryKey: [
      "branches",
      isSuper ? "super" : "single",
      opts.businessTypeId ?? null,
      opts.oneBranchId ?? null,
    ],
    enabled: authReady,
    queryFn: async () => {
      let url: string;

      if (isSuper) {
        if (opts.businessTypeId != null) {
          url = `/sucursales/tipo-negocio/${opts.businessTypeId}`;
        } else {
          url = `/sucursales`;
        }
      } else if (opts.oneBranchId != null) {
        url = `/sucursales/${opts.oneBranchId}`;
      } else {
        return [];
      }

      const { data } = await api.get(url);

      const arr = Array.isArray(data) ? data : [data];
      return toBranchArray(arr);
    },
    staleTime: CATALOG_STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: ISRFEFECTHON,  
    retry: 1,
  });
}
/** Detalle de sucursal para derivar su businessTypeId */
export async function fetchBranchInfo(
  branchId: number,
  token: string
): Promise<BranchInfo> {
  const url = `${BASE}/sucursales/${branchId}`;
  return getJsonUnknown(url, token) as Promise<BranchInfo>;
}

export function useSucursales() {
  return useQuery<Sucursal[], Error>({
    queryKey: ["sucursales", "v1"],
    queryFn: async () => {
      const { data } = await api.get<Sucursal[]>("/sucursales");
      return data;
    },
    initialData: [],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: ISRFEFECTHON,
    retry: 1,
  });
}

export function useBusinessTypes() {
  return useQuery<BusinessType[], Error>({
    queryKey: ["business-types"],
    queryFn: fetchBusinessTypes,
    staleTime: CATALOG_STALE_TIME,
    gcTime: CACHE_TIME,    // 👈
    refetchOnWindowFocus: ISRFEFECTHON,  
  });
}


/** Métodos de pago */
export function usePaymentMethods(params?: Record<string, unknown>) {
  return useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods", params],
    queryFn: async () => {
      const { data } = await api.get<PaymentMethod[]>("/metodo-pago", { params });
      return data;
    },
    staleTime: CATALOG_STALE_TIME,
    gcTime: CACHE_TIME,    // 👈
    refetchOnWindowFocus: ISRFEFECTHON,  
  });
}
/** Productos */
export function useProducts(params?: Record<string, unknown>) {
 return useQuery<CatalogItem[]>({
  queryKey: ["products", JSON.stringify(params ?? {})],
  queryFn: async () => {
      const { data } = await api.get<CatalogItem[]>("/productos", { params });
      return data;
    },
    staleTime: 5 * 60_000, 
  });
}
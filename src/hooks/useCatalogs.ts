import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchBusinessTypes, type BusinessType } from "@/features/productos/api";
import { api } from "@/lib/api";
import http from "@/lib/http";
/* ==== Tipos comunes ==== */
export type CatalogItem = { id: number; name: string };


export interface PaymentMethod {
  id: number;
  name: string;
}
type StatusCatalog = {
  data: CatalogItem[];
  loading: boolean;
  error?: string;
};
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

type UnknownRecord = Record<string, unknown>;

function isObject(x: unknown): x is UnknownRecord {
  return typeof x === "object" && x !== null;
}

function isPageResponse<T>(x: unknown): x is PageResponse<T> {
  if (!isObject(x)) return false;
  const c = (x as { content?: unknown }).content;
  return Array.isArray(c);
}
const BASE = import.meta.env.VITE_API_BASE_URL;
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
}): StatusCatalog {

  const { token, isSuper: isSuperFromAuth, user } = useAuth(); // user ayuda a saber si el auth ya cargó
  const [st, setSt] = useState<StatusCatalog>({ data: [], loading: true });

  const isSuper = opts.isSuper ?? isSuperFromAuth;


  const url = useMemo(() => {
    if (isSuper) {
      if (opts.businessTypeId != null) {
        return `${BASE}/categorias/tipo-negocio/${opts.businessTypeId}`;
      }
      return `${BASE}/categorias`; // todas
    }
    if (opts.branchId != null) {
      return `${BASE}/categorias/sucursal/${opts.branchId}`;
    }
    if (opts.businessTypeId != null) {
      return `${BASE}/categorias/tipo-negocio/${opts.businessTypeId}`;
    }
    return `${BASE}/categorias/actual`; // fallback
  }, [isSuper, opts.businessTypeId, opts.branchId]);

  // Evita el fetch mientras el auth aún no está listo
  const ready = Boolean(token && (opts.isSuper !== undefined || user)); 
  // ^ si el caller mandó isSuper, no dependemos de user; si no, esperamos a que user exista.


  useEffect(() => {
    if (!ready) return;

    let alive = true;
    (async () => {
      try {
        setSt(s => ({ ...s, loading: true, error: undefined }));
        const raw = await getJsonUnknown<unknown>(url, token!);

        const payload: unknown[] =
          Array.isArray(raw)
            ? raw
            : isPageResponse<unknown>(raw)
              ? (raw as PageResponse<unknown>).content
              : [];

        const data = toCatalogArray(payload);
        if (alive) setSt({ data, loading: false });
      } catch (e) {
        if (alive) setSt({ data: [], loading: false, error: (e as Error).message });
      }
    })();

    return () => { alive = false; };
  }, [ready, url, token]);

  // Si no está listo, reporta loading para no “parpadear” en /actual
  if (!ready) return { data: [], loading: true };

  return st;
}

/** Proveedores
 * SUPER_ADMIN: /proveedores?businessTypeId={id} | /proveedores (todos)
 * Otros:      /proveedores (filtrados por sesión)
 */
export function useProviders(opts: { businessTypeId?: number | null; isSuper?: boolean }): StatusCatalog {
  const { token } = useAuth() as unknown as { token: string };
  const [st, setSt] = useState<StatusCatalog>({ data: [], loading: true });

  const url = useMemo(() => {
    if (opts.isSuper) {
      if (opts.businessTypeId != null) {
        return `${BASE}/proveedores?businessTypeId=${opts.businessTypeId}`;
      }
      return `${BASE}/proveedores`;
    }
    return `${BASE}/proveedores`;
  }, [opts.isSuper, opts.businessTypeId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSt((s) => ({ ...s, loading: true, error: undefined }));
        const raw = await getJsonUnknown<unknown>(url, token);
        const data = toCatalogArray(raw);
        if (alive) setSt({ data, loading: false });
      } catch (e) {
        if (alive) setSt({ data: [], loading: false, error: (e as Error).message });
      }
    })();
    return () => { alive = false; };
  }, [url, token]);

  return st;
}

/** Sucursales
 * - oneBranchId: si lo pasas, trae UNA sucursal por id (/sucursales/{id})
 * - SUPER_ADMIN + businessTypeId: lista por tipo de negocio (/sucursales/tipo-negocio/{id})
 * - default: sucursales del usuario (/sucursales/actual)
 */
// src/hooks/useCatalogs.ts  (fragmento clave)
export function useBranches(opts: {
  businessTypeId?: number | null;
  oneBranchId?: number | null;
  isSuper?: boolean;
}): StatusCatalog {
  const { token, hasRole } = useAuth() as unknown as {
    token: string;
    hasRole: (r: string) => boolean;
  };

  const [st, setSt] = useState<StatusCatalog>({ data: [], loading: true });
  const { oneBranchId, businessTypeId } = opts;

  // ✅ Evalúa isSuper automáticamente
  const isSuper = opts.isSuper ?? hasRole?.("SUPER_ADMIN") ?? false;

  const url = useMemo(() => {
    if (oneBranchId != null) return `${BASE}/sucursales/${oneBranchId}`;
    if (isSuper) {
      if (businessTypeId != null) return `${BASE}/sucursales/tipo-negocio/${businessTypeId}`;
      return `${BASE}/sucursales`;
    }
    return `${BASE}/sucursales/actual`;
  }, [oneBranchId, businessTypeId, isSuper]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSt((s) => ({ ...s, loading: true, error: undefined }));
        const raw = await getJsonUnknown<unknown>(url, token);

        const payload: unknown[] = Array.isArray(raw)
          ? raw
          : isPageResponse<unknown>(raw)
          ? (raw as PageResponse<unknown>).content
          : [];

        const data = toCatalogArray(payload);
        if (alive)
          setSt({ data, loading: false, error: data.length ? undefined : "No hay sucursales" });
      } catch (e) {
        if (alive) setSt({ data: [], loading: false, error: (e as Error).message });
      }
    })();
    return () => {
      alive = false;
    };
  }, [url, token]);

  return st; // ✅ asegúrate de tener este return
}

/** Detalle de sucursal para derivar su businessTypeId */
export async function fetchBranchInfo(
  branchId: number,
  token: string
): Promise<{ id: number; name: string; businessTypeId: number }> {
  const url = `${BASE}/sucursales/${branchId}`;
  return getJsonUnknown(url, token) as Promise<{ id: number; name: string; businessTypeId: number }>;
}

export function useSucursales() {
  return useQuery<Sucursal[], Error>({
    queryKey: ["sucursales", "v1"],
    queryFn: async () => {
      const { data } = await http.get<Sucursal[]>("/sucursales");
      return data;
    },
    initialData: [],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useBusinessTypes() {
  return useQuery<BusinessType[], Error>({
    queryKey: ["business-types"],
    queryFn: fetchBusinessTypes,
    staleTime: 5 * 60_000,
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
    staleTime: 5 * 60_000, // 5 minutos en caché
  });
}
/** Productos */
export function useProducts(params?: Record<string, unknown>) {
  return useQuery<CatalogItem[]>({
    queryKey: ["products", params],
    queryFn: async () => {
      const { data } = await api.get<CatalogItem[]>("/productos", { params });
      return data;
    },
    staleTime: 5 * 60_000, // cache por 5 minutos
  });
}
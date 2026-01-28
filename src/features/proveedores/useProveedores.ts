import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Proveedor, CreateProveedorDto, UpdateProveedorDto } from "./types";
import {
  fetchProveedores,
  fetchProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from "./proveedores.api";

export const proveedoresKeys = {
  all: ["proveedores"] as const,
  list: () => [...proveedoresKeys.all, "list"] as const,
  detail: (id: number) => [...proveedoresKeys.all, "detail", id] as const,
};

const staleTimeMs = 30 * 24 *60 * 1000;
const CACHE_TIME = 30 * 24 * 60 * 60_000;

export function useProveedoresList() {
  return useQuery<Proveedor[], Error>({
    queryKey: proveedoresKeys.list(),
    queryFn: fetchProveedores,
    staleTime: staleTimeMs,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useProveedor(id?: number) {
  return useQuery<Proveedor, Error>({
    queryKey: proveedoresKeys.detail(id ?? 0),
    queryFn: () => fetchProveedorById(id as number),
    enabled: typeof id === "number" && id > 0,
    staleTime: staleTimeMs,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation<Proveedor, Error, CreateProveedorDto>({
    mutationFn: createProveedor,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: proveedoresKeys.list() });
    },
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation<Proveedor, Error, { id: number; payload: UpdateProveedorDto }>({
    mutationFn: ({ id, payload }) => updateProveedor(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(proveedoresKeys.detail(updated.id), updated);
      void qc.invalidateQueries({ queryKey: proveedoresKeys.list() });
    },
  });
}

export function useDeleteProveedor() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteProveedor,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: proveedoresKeys.list() });
    },
  });
}
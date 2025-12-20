import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProveedores,
  fetchProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
} from "@/features/proveedores/proveedores.api";
import { CreateProveedorDto, UpdateProveedorDto } from "@/features/proveedores/types";
import type { Proveedor } from "@/features/proveedores/types";


export function useProveedores() {
  return useQuery<Proveedor[]>({
    queryKey: ["proveedores"],
    queryFn: fetchProveedores,
  });
}

export function useProveedorById(id: number) {
  return useQuery({
    queryKey: ["proveedor", id],
    queryFn: () => fetchProveedorById(id),
    enabled: !!id,
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProveedorDto) => createProveedor(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProveedorDto }) =>
      updateProveedor(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });
}

export function useDeleteProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProveedor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });
}

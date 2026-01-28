import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCliente,
  disableCliente,
  fetchClienteById,
  fetchClientes,
  updateCliente,
  fetchClientesPage, 
} from "./clientes.api";
import type { ClienteDTO, ClienteFiltroDTO, CreateClienteDto } from "./types";
const staleTimeMs = 30 * 24 *60 * 1000;
const CACHE_TIME = 30 * 24 * 60 * 60_000;

export const clientesKeys = {
  all: ["clientes"] as const,
  list: () => [...clientesKeys.all, "list"] as const,
  page: (args: unknown) => [...clientesKeys.all, "page", args] as const,
  detail: (id: number) => [...clientesKeys.all, "detail", id] as const,
};

export function useClientes() {
  return useQuery({
    queryKey: clientesKeys.list(),
    queryFn: fetchClientes,
    staleTime: staleTimeMs,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCliente(id?: number) {
  return useQuery({
    queryKey: id ? clientesKeys.detail(id) : clientesKeys.detail(-1),
    queryFn: () => fetchClienteById(id as number),
    enabled: typeof id === "number" && id > 0,
    staleTime: staleTimeMs,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClienteDto) => createCliente(payload),
    onSuccess: async () => {
    await qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClienteDTO }) =>
      updateCliente(id, payload),

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDisableCliente() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => disableCliente(id),
    onSuccess: async () => {
    await qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useClientesPage(args: {
  page: number;
  size: number;
  sortBy?: string;
  direction?: "asc" | "desc";
  filtro?: ClienteFiltroDTO;
}) {
  return useQuery({
    queryKey: clientesKeys.page(args),
    queryFn: () => fetchClientesPage(args),
    staleTime: staleTimeMs,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
  });
}
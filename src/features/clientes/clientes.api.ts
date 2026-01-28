import { api } from "@/lib/api";
import type {
  ClienteDTO,
  ClienteFiltroDTO,
  ClienteResponseDTO,
  CreateClienteDto,
  PageResponse, 
} from "./types";

export async function fetchClientes(): Promise<ClienteResponseDTO[]> {
  const { data } = await api.get<ClienteResponseDTO[]>("/clientes");
  return Array.isArray(data) ? data : [];
}

export async function fetchClienteById(id: number): Promise<ClienteResponseDTO> {
  const { data } = await api.get<ClienteResponseDTO>(`/clientes/${id}`);
  return data;
}

export async function createCliente(payload: CreateClienteDto): Promise<ClienteResponseDTO> {
  const { data } = await api.post<ClienteResponseDTO>("/clientes", payload);
  return data;
}

export async function updateCliente(
  id: number,
  payload: ClienteDTO
): Promise<ClienteResponseDTO> {
  const { data } = await api.put<ClienteResponseDTO>(`/clientes/${id}`, payload);
  return data;
}

export async function disableCliente(id: number): Promise<void> {
  await api.delete(`/clientes/${id}`);
}

export async function filterClientes(
  payload: ClienteFiltroDTO
): Promise<ClienteResponseDTO[]> {
  const { data } = await api.post<ClienteResponseDTO[]>("/clientes/filter", payload);
  return Array.isArray(data) ? data : [];
}

export async function fetchClientesPage(params: {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "asc" | "desc";
  filtro?: ClienteFiltroDTO;
}): Promise<PageResponse<ClienteResponseDTO>> {
  const {
    page = 0,
    size = 10,
    sortBy = "name",
    direction = "asc",
    filtro = {},
  } = params;

  const { data } = await api.get<PageResponse<ClienteResponseDTO>>("/clientes/page", {
    params: { ...filtro, page, size, sortBy, direction },
  });

  return data;
}
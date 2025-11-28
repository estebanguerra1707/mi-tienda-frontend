import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface ClientItem extends Client {
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}


async function fetchClients(): Promise<Client[]> {
  const res = await api.get("/clientes");
  return res.data;
}

/**
 * Hook para obtener la lista de clientes
 * Usa React Query para caching y revalidación automática
 */
export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    staleTime: 60_000, // 1 minuto de caché
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProductItem, PageResponse } from "@/types/product";

export type ProductsByBranchResponse =
  | ProductItem[]
  | PageResponse<ProductItem>;

export const productByBranchKeys = {
  all: ["productsByBranch"] as const,
  list: (branchId?: number | null) =>
    [...productByBranchKeys.all, branchId ?? "all"] as const,
};

export function useProductsByBranch(branchId?: number | null) {
  const isSuperAdmin = branchId === undefined || branchId === null;

  return useQuery<ProductsByBranchResponse, Error>({
    queryKey: productByBranchKeys.list(branchId),
    queryFn: async () => {
      if (isSuperAdmin) {
        const { data } = await api.get("/productos");
        return data;
      }

      const { data } = await api.get(`/productos/by-branch/${branchId}`);
      return data;
    },
    enabled: true,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

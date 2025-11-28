import { useQuery } from "@tanstack/react-query";
import { getUserById } from "./users.service";

export function useUserById(id: number) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

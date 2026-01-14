import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,          // 30s
      gcTime: 10 * 60_000,         // 10 min bloqueo pantalla
      refetchOnWindowFocus: false,
    },
  },
});

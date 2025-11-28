import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,          // 30s
      gcTime: 5 * 60_000,         // 5 min
      refetchOnWindowFocus: false,
    },
  },
});

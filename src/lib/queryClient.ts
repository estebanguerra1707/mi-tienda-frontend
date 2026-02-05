import { QueryClient } from '@tanstack/react-query';

const ONE_HOUR = 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: ONE_HOUR,
       gcTime: ONE_HOUR,       // 1 hr min bloqueo pantalla
      refetchOnWindowFocus: false,
    },
  },
});

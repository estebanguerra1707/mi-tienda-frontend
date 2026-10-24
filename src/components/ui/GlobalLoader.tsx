// src/components/ui/GlobalLoader.tsx
import { useEffect, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";

export function GlobalLoader() {
  const [isAxiosLoading, setIsAxiosLoading] = useState(false);
  // Detecta cualquier useMutation (POST/PUT/DELETE) de React Query en toda la app
  const isReactQueryMutating = useIsMutating();

  useEffect(() => {
    const handleLoading = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setIsAxiosLoading(Boolean(customEvent.detail));
    };

    window.addEventListener("globalLoading", handleLoading);
    return () => {
      window.removeEventListener("globalLoading", handleLoading);
    };
  }, []);

  const showOverlay = isAxiosLoading || isReactQueryMutating > 0;

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/45 backdrop-blur-[2px] cursor-wait select-none pointer-events-auto transition-opacity">
      <div className="bg-white px-7 py-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-3 border border-slate-100">
        {/* Spinner doble animado */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute"></div>
        </div>
        <p className="text-slate-800 font-bold text-sm tracking-wide animate-pulse">
          Procesando operación...
        </p>
      </div>
    </div>
  );
}
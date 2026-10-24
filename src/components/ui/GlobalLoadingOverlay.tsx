import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function GlobalLoadingOverlay() {
  // Detecta automáticamente cualquier useMutation activo en CUALQUIER página
  const isMutating = useIsMutating();
  
  // Estado adicional por si haces peticiones directas con Axios sin useMutation
  const [axiosMutating, setAxiosMutating] = useState(0);

  useEffect(() => {
    const handleStart = () => setAxiosMutating((prev) => prev + 1);
    const handleEnd = () => setAxiosMutating((prev) => Math.max(0, prev - 1));

    window.addEventListener("global-mutation-start", handleStart);
    window.addEventListener("global-mutation-end", handleEnd);

    return () => {
      window.removeEventListener("global-mutation-start", handleStart);
      window.removeEventListener("global-mutation-end", handleEnd);
    };
  }, []);

  const isActive = isMutating > 0 || axiosMutating > 0;

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-[2px] transition-all duration-150 select-none">
      <div className="bg-white px-7 py-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Spinner doble animado */}
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-blue-100 rounded-full"></div>
          <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute"></div>
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-bold text-base tracking-wide">
            Procesando...
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Por favor espera un momento
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import { forwardRef } from "react";
import BuscadorDevolucionesCompras, {
  BuscadorDevolucionesComprasHandle,
} from "@/features/devolucion/devolucion-compras/components/BuscadorDevolucionesCompras";

const BusquedaDevolucionesComprasPage = forwardRef<
  BuscadorDevolucionesComprasHandle,
  unknown
>((props, ref) => {
  return (
    <div
      className="
        w-full 
        max-w-5xl 
        mx-auto 
        px-4 sm:px-6 
        py-4 
        space-y-6
      "
    >
      <div
        className="
          bg-white 
          rounded-xl 
          shadow-md 
          border 
          p-4 sm:p-6 
          transition
        "
      >
        <BuscadorDevolucionesCompras ref={ref} />
      </div>
    </div>
  );
});

BusquedaDevolucionesComprasPage.displayName =
  "BusquedaDevolucionesComprasPage";

export default BusquedaDevolucionesComprasPage;

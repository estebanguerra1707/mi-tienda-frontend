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
    <div className="space-y-4">
      <BuscadorDevolucionesCompras ref={ref} />
    </div>
  );
});

BusquedaDevolucionesComprasPage.displayName =
  "BusquedaDevolucionesComprasPage";

export default BusquedaDevolucionesComprasPage;

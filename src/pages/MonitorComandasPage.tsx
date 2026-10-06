"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PanelNuevaVenta from "./../features/ventas/components/PanelNuevaVenta";
import TableroKanban from "./../features/ventas/pages/TableroKanban";

export default function MonitorComandasPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Estado para el ancho del panel izquierdo
  const [sidebarWidth, setSidebarWidth] = useState(450); 
  
  // Referencias para el estado de arrastre y para medir la pantalla real
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null); // <-- Fundamental para ignorar el menú lateral

  const handleVentaCreada = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const startResizing = () => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current && containerRef.current) {
      // 1. Obtenemos dónde empieza realmente este componente (ignorando el menú azul)
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      
      // 2. Calculamos el ancho real restando ese espacio
      const newWidth = e.clientX - containerLeft;

      // 3. Limitamos para que no colapse ni empuje demasiado (mínimo 380px, máximo 900px)
      const constrainedWidth = Math.max(380, Math.min(newWidth, 900));
      setSidebarWidth(constrainedWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    // Se agrega el ref al contenedor principal
    <div ref={containerRef} className="flex h-screen w-full bg-slate-100 overflow-hidden relative">
      
      {/* PANEL IZQUIERDO: Registrar nueva venta */}
      <aside 
        style={{ width: sidebarWidth }} 
        className="bg-white shadow-xl flex flex-col z-10 border-r shrink-0"
      >
        <PanelNuevaVenta onCreated={handleVentaCreada} />
      </aside>

      {/* BARRA DE REDIMENSIONAMIENTO (Divisor) */}
      <div 
        onMouseDown={startResizing}
        className="w-2 bg-slate-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize transition-colors duration-150 flex items-center justify-center shrink-0 z-20 group"
      >
        {/* Línea visual decorativa en el centro */}
        <div className="h-12 w-1 bg-slate-400 group-hover:bg-white rounded-full pointer-events-none transition-colors" />
      </div>

      {/* PANEL DERECHO: En Preparación (Cocina) */}
      <main className="flex-1 h-full overflow-hidden p-4 flex flex-col">
        <TableroKanban refreshTrigger={refreshKey} />
      </main>

    </div>
  );
}
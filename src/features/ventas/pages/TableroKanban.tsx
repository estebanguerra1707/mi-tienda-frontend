"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useComandasEnPreparacion, useActualizarEstadoOrden } from "@/hooks/useVentas";
import { Button } from "@/components/ui/Button";

// ✅ NUEVO COMPONENTE: Actualiza los minutos transcurridos en tiempo real
function TiempoTranscurrido({ saleDate }: { saleDate: string }) {
  const [minutos, setMinutos] = useState(() => {
    const diff = dayjs().diff(dayjs(saleDate), "minute");
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    const calcularMinutos = () => {
      const diff = dayjs().diff(dayjs(saleDate), "minute");
      setMinutos(diff > 0 ? diff : 0);
    };
    
    // Actualiza cada 60 segundos (60000 ms)
    const intervalo = setInterval(calcularMinutos, 60000);
    return () => clearInterval(intervalo);
  }, [saleDate]);

  if (minutos === 0) return null;
  return <span>(Hace {minutos} min)</span>;
}

export default function TableroKanban({ refreshTrigger }: { refreshTrigger: number }) {
  
  const { data: comandas, refetch, isLoading } = useComandasEnPreparacion();
  const { mutate: actualizarEstado, isPending } = useActualizarEstadoOrden();

  // Escuchar cuando el panel izquierdo crea una venta nueva
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Cargando comandas...</div>;
  }

  // Ordenamos de la más vieja (urgente) a la más nueva
  const comandasOrdenadas = comandas?.sort((a, b) => 
    new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()
  ) || [];

  return (
    <div className="flex w-full h-full gap-6 overflow-hidden">      
      {/* Columna Principal: EN PREPARACIÓN */}
      <div className="flex-1 bg-amber-50/50 rounded-xl border-2 border-amber-200 flex flex-col shadow-sm">
        
        {/* Cabecera Columna */}
        <div className="bg-amber-400 text-amber-950 font-black p-4 rounded-t-lg text-lg flex justify-between items-center shadow-md">
          <span>EN PREPARACIÓN (COCINA)</span>
          <span className="bg-white/50 px-3 py-1 rounded-full text-sm">
            {comandasOrdenadas.length} órdenes
          </span>
        </div>
        
        {/* Cuerpo de la Columna (Scrollable Grid) */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          {comandasOrdenadas.length === 0 ? (
            <div className="text-center mt-20 text-amber-600/60 font-semibold text-lg italic">
              No hay pedidos en espera.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 auto-rows-max">
              
              {/* Iteración de Tickets */}
              {comandasOrdenadas.map((comanda) => {
                const horaCreacion = dayjs(comanda.saleDate);
                // Cálculo estático inicial para el fondo rojo urgente
                const minutosEsperaInicial = dayjs().diff(horaCreacion, 'minute');
                const isUrgente = minutosEsperaInicial >= 30;

                return (
                  <div key={comanda.id} className="bg-white rounded-lg border shadow-md flex flex-col overflow-hidden">
                    
                    {/* Header del Ticket */}
                    <div className={`p-3 border-b flex justify-between items-center text-white font-bold
                      ${isUrgente ? 'bg-red-600' : 'bg-slate-800'}
                    `}>
                      <div className="text-lg">
                        #{comanda.id}
                      </div>
                      <div className="flex flex-col items-end text-xs">
                        <span>{horaCreacion.format('hh:mm A')}</span>
                        {/* ✅ COMPONENTE EN VIVO */}
                        <TiempoTranscurrido saleDate={comanda.saleDate} />
                      </div>
                    </div>

                    {/* Cliente (Opcional) */}
                    {comanda.clientName && comanda.clientName !== "Público en General" && (
                      <div className="bg-slate-100 p-2 text-sm font-semibold text-slate-700 border-b">
                        Cliente: {comanda.clientName}
                      </div>
                    )}

                    {/* Lista de Platillos */}
                    <div className="p-3 flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                      <div className="flex flex-col gap-3">
                        {comanda.details?.map((detalle, i) => {
                          // ✅ Lógica de colores dinámicos
                          const lowerName = detalle.productName.toLowerCase();
                          const isVerde = lowerName.includes("verde");
                          const isRojo = lowerName.includes("rojo");
                          
                          const textTitleColor = isVerde ? "text-green-800" : isRojo ? "text-red-800" : "text-slate-900";
                          const textExtraColor = isVerde ? "text-green-600" : isRojo ? "text-red-600" : "text-emerald-600";

                          return (
                            <div key={i} className="flex flex-col">
                              {/* Cantidad y Nombre */}
                              <div className="flex items-start gap-2">
                                <span className="font-black text-lg min-w-[24px] text-slate-700">
                                  {detalle.quantity}x
                                </span>
                                <span className={`font-bold text-base uppercase leading-tight ${textTitleColor}`}>
                                  {detalle.productName}
                                </span>
                              </div>

                              {/* Extras (Heredan el color) */}
                              {detalle.extras && detalle.extras.length > 0 && (
                                <div className="ml-8 mt-1 flex flex-col">
                                  {detalle.extras.map((ex, exIdx) => (
                                    <span key={exIdx} className={`text-sm font-semibold ${textExtraColor}`}>
                                      + {ex.productName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Notas de cocina */}
                              {detalle.notes && (
                                <div className="ml-8 mt-1 text-sm font-bold text-red-600 flex items-center gap-1 bg-red-50 p-1 rounded">
                                  ⚠️ {detalle.notes}
                                </div>
                              )}
                              
                              {/* Separador */}
                              {i < comanda.details.length - 1 && <hr className="my-2 border-slate-100" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Botón de Acción Fijo al pie de la tarjeta */}
                    <div className="p-3 bg-slate-50 border-t">
                      <Button 
                        onClick={() => actualizarEstado({ id: comanda.id, estado: "ENTREGADO" })}
                        disabled={isPending}
                        className="w-full h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md active:scale-95"
                      >
                        ENTREGAR ORDEN
                      </Button>
                    </div>

                  </div>
                )
              })}

            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
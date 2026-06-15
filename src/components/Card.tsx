import React from "react";

interface CardDetalle {
  label: string;
  value: string;
  subValue?: string;
}

interface CardProps {
  titulo: string;
  valor: number | string;
  detalles?: CardDetalle[];
  detalleTitulo?: string;
}

export function Card({ titulo, valor, detalles = [], detalleTitulo }: CardProps) {
  const hasDetalles = detalles.length > 0;

  return (
    <div
      className="
        relative
        group
        p-4
        border
        rounded
        shadow
        bg-white
        outline-none
      "
      tabIndex={0}
    >
      <h3 className="text-sm text-gray-500">{titulo}</h3>

      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold mt-1">{valor}</p>

        {hasDetalles && (
          <span className="mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            detalle
          </span>
        )}
      </div>

      {hasDetalles && (
        <div
          className="
            pointer-events-none
            absolute
            left-0
            top-full
            mt-2
            z-50
            w-[280px]
            rounded-xl
            border
            bg-white
            p-3
            shadow-xl
            opacity-0
            translate-y-1
            transition
            group-hover:opacity-100
            group-hover:translate-y-0
            group-focus:opacity-100
            group-focus:translate-y-0
          "
        >
          <p className="font-semibold text-gray-900 text-sm border-b pb-2 mb-2">
            {detalleTitulo ?? titulo}
          </p>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {detalles.map((d, idx) => (
              <div key={`${d.label}-${idx}`} className="text-xs">
                <p className="font-semibold text-gray-800 truncate">
                  {d.label}
                </p>
                <p className="text-blue-700 font-bold">{d.value}</p>
                {d.subValue && <p className="text-gray-500">{d.subValue}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
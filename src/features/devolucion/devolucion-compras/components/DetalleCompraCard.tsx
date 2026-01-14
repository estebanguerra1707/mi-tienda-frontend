import type { CompraItem, DetalleCompraResponseDTO } from "@/features/compras/api";

interface Props {
  compra: CompraItem;
  onSelectDetalle: (detalle: DetalleCompraResponseDTO) => void;
}

export default function DetalleCompraCard({
  compra,
  onSelectDetalle,
}: Props) {
  return (
    <div className="space-y-3">

      {/* HEADER SIMPLE */}
      <h2 className="text-base font-semibold">
        Productos · Compra #{compra.id}
      </h2>

      {compra.details?.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No hay productos asociados a esta compra.
        </p>
      )}

      {/* LISTA MOBILE-FIRST */}
      <div className="space-y-2">
        {compra.details?.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelectDetalle(d)}
            className="
              w-full flex justify-between items-center
              px-3 py-3
              border rounded-lg
              text-left
              transition
              hover:bg-blue-50 
              active:bg-blue-100
            "
          >
            <div className="space-y-0.5">
              <p className="font-medium text-gray-800">
                {d.productName}
              </p>

              <p className="text-xs text-gray-600">
                Cant: {d.quantity} · ${d.unitPrice.toFixed(2)}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                  ${
                    d.ownerType === "PROPIO"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
              >
                {d.ownerType}
              </span>
            </div>

            {/* INDICADOR TÁCTIL */}
            <span className="text-blue-600 text-lg leading-none">
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
 
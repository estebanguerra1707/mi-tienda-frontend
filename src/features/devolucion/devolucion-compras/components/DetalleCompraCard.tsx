import type { CompraItem, DetalleCompraResponseDTO } from "@/features/compras/api";

interface Props {
  compra: CompraItem;
  onSelectDetalle: (detalle: DetalleCompraResponseDTO) => void;
}

export default function DetalleCompraCard({ compra, onSelectDetalle }: Props) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Productos de la compra <span className="text-blue-600">#{compra.id}</span>
      </h2>

      {compra.details?.length === 0 && (
        <p className="text-gray-500 italic">No hay productos asociados a esta compra.</p>
      )}

      <div className="grid gap-4">
        {compra.details?.map((d: DetalleCompraResponseDTO) => (
          <button
            key={d.id}
            onClick={() => onSelectDetalle(d)}
            className="flex justify-between items-center p-4 rounded-lg border border-gray-200 shadow-sm 
                       hover:bg-blue-50 hover:border-blue-400 transition duration-150 text-left"
          >
            <div className="space-y-1">
              <p className="text-gray-700 font-medium text-lg">{d.productName}</p>

              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Cantidad:</span> {d.quantity}
              </p>

              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Precio unitario:</span>{" "}
                ${d.unitPrice.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center text-blue-600 font-semibold">
              Ver detalle →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

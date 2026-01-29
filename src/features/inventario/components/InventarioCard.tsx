import type { InventoryItem } from "@/hooks/useInventory";
import EditInventarioButton from "./EditInventoryButton";
import MarkCriticalButton from "./MarkCriticalButton";

interface InventarioCardProps {
  row: InventoryItem;
  usaInventarioPorDuenio: boolean;
  canEdit: boolean;
  onUpdated: () => void;
}

export default function InventarioCard({
  row,
  usaInventarioPorDuenio,
  canEdit,
  onUpdated,
}: InventarioCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">

      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            ID #{row.productId}
          </p>

          <p className="font-semibold break-words">
            {row.productName}
          </p>

          <p className="text-sm text-slate-600">
            {row.branchName}
          </p>
        </div>

        <span
          className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold
            ${row.isStockCritico
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"}
          `}
        >
          {row.isStockCritico ? "Crítico" : "OK"}
        </span>
      </div>

      {/* Stock */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-slate-500">Stock</p>
          <p className="font-semibold">{row.stock}</p>
        </div>

        <div>
          <p className="text-slate-500">Min</p>
          <p>{row.minStock ?? "—"}</p>
        </div>

        <div>
          <p className="text-slate-500">Max</p>
          <p>{row.maxStock ?? "—"}</p>
        </div>
      </div>

      {/* Owner */}
      {usaInventarioPorDuenio && (
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-semibold
            ${row.ownerType === "PROPIO"
              ? "bg-green-100 text-green-700"
              : "bg-blue-100 text-blue-700"}
          `}
        >
          {row.ownerType === "PROPIO" ? "Propio" : "Consignación"}
        </span>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end gap-2 pt-2">
          <EditInventarioButton row={row} onUpdated={onUpdated} />
          <MarkCriticalButton
            id={row.id}
            current={!!row.isStockCritico}
            onUpdated={onUpdated}
          />
        </div>
      )}
    </div>
  );
}
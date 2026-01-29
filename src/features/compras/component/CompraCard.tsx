import type { CompraItem } from "@/features/compras/api";
import DeleteCompraButton from "@/features/compras/component/DeleteCompraButton";

interface CompraCardProps {
  compra: CompraItem;
  isSuperAdmin: boolean;
  onOpen: () => void;
  onDeleted: () => void;
}

const formatMoney = (n: number) => `$${(Number(n ?? 0)).toFixed(2)}`;

const formatDate = (iso: string, withTime: boolean) => {
  const d = new Date(iso);
  return withTime
    ? d.toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : d.toLocaleDateString("es-MX");
};

export default function CompraCard({
  compra,
  isSuperAdmin,
  onOpen,
  onDeleted,
}: CompraCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="
        w-full max-w-full overflow-hidden
        text-left
        rounded-2xl border border-slate-200 bg-white
        p-4 shadow-sm
        hover:bg-slate-50 active:scale-[0.99]
        transition
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              #{compra.id}
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
              {compra.paymentName}
            </span>
          </div>

          <div className="mt-2 font-semibold text-slate-900 break-words">
            {compra.providerName}
          </div>

          <div className="mt-1 text-sm text-slate-600">
            {formatDate(compra.purchaseDate, isSuperAdmin)}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">
            {formatMoney(compra.amountPaid)}
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600 break-all">
            <span className="text-slate-500">Usuario:</span>{" "}
            <span className="font-medium text-slate-800">{compra.userName}</span>
          </div>

          <div
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <DeleteCompraButton id={compra.id} onDeleted={onDeleted} />
          </div>
        </div>
      )}
    </button>
  );
}
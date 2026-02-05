import { useState } from "react";
import { useUpdateInventory } from "../useMutations";
import { getErrorMessage } from "../getErrorMessage";

export default function MarkCriticalButton({
  id,
  current,
  onUpdated,
}: {
  id: number;
  current: boolean;
  onUpdated?: () => void;
}) {
  const { mutateAsync, isPending } = useUpdateInventory();
  const [err, setErr] = useState<string | null>(null);

  const toggle = async () => {
    setErr(null);
    try {
      await mutateAsync({ id, payload: { isStockCritico: !current } }); 
      onUpdated?.();
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        className={`
          inline-flex items-center justify-center
          h-10 px-4
          text-xs font-semibold
          rounded-xl
          ${current ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-900"}
          hover:opacity-90
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98]
          transition
        `}
        onClick={toggle}
        disabled={isPending}
        title={current ? "Quitar crítico" : "Marcar crítico"}
        aria-label={current ? "Quitar crítico" : "Marcar crítico"}
      >
        {isPending ? "…" : current ? "Quitar crítico" : "Marcar crítico"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

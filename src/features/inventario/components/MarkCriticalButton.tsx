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
        className={`px-2 py-1 text-xs rounded ${current ? "bg-amber-500" : "bg-slate-200"} hover:opacity-90`}
        onClick={toggle}
        disabled={isPending}
        title={`PUT /inventario/${id}`}
      >
        {isPending ? "…" : current ? "Quitar crítico" : "Marcar crítico"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

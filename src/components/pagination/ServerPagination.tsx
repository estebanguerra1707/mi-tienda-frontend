type Props = {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
};

export function ServerPagination({ page, totalPages, onChange }: Props) {
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);

  const canPrev = safePage > 1;
  const canNext = safePage < safeTotal;

  return (
    <div className="w-full flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onChange(safePage - 1)}
        disabled={!canPrev}
        className="h-10 px-3 rounded-xl border bg-white disabled:opacity-40"
      >
        ←
      </button>

      <div className="flex-1 text-center text-sm font-medium text-slate-700">
        Página {safePage} de {safeTotal}
      </div>

      <button
        type="button"
        onClick={() => onChange(safePage + 1)}
        disabled={!canNext}
        className="h-10 px-3 rounded-xl border bg-white disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

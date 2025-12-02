type Props = {
  page: number;        // página actual (1-based)
  totalPages: number;  // total
  onChange: (page: number) => void;
};

export function ServerPagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const go = (n: number) =>
    onChange(Math.min(Math.max(n, 1), totalPages));

  return (
    <div className="flex items-center justify-end gap-2 mt-4">

      <button
        className="px-3 py-1 border rounded bg-white disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        ←
      </button>

      {[...Array(totalPages)].map((_, i) => {
        const num = i + 1;
        const active = num === page;
        return (
          <button
            key={num}
            onClick={() => go(num)}
            className={`px-3 py-1 rounded border text-sm ${
              active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {num}
          </button>
        );
      })}

      <button
        className="px-3 py-1 border rounded bg-white disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        →
      </button>
    </div>
  );
}

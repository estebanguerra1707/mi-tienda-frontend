type Props = {
  page: number;
  maxPage: number;
  next: () => void;
  prev: () => void;
  goTo: (n: number) => void;
};

export function Pagination({ page, maxPage, next, prev, goTo }: Props) {
  if (maxPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-4">

      {/* Anterior */}
      <button
        onClick={prev}
        disabled={page === 1}
        className="px-3 py-1 rounded border shadow-sm bg-white disabled:opacity-40"
      >
        ←
      </button>

      {/* Números */}
      <div className="flex gap-1">
        {[...Array(maxPage)].map((_, i) => {
          const num = i + 1;
          const active = page === num;
          return (
            <button
              key={num}
              onClick={() => goTo(num)}
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
      </div>

      {/* Siguiente */}
      <button
        onClick={next}
        disabled={page === maxPage}
        className="px-3 py-1 rounded border shadow-sm bg-white disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

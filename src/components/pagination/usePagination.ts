import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], perPage = 5) {
  const [page, setPage] = useState(1);

  const maxPage = Math.ceil(items.length / perPage);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [page, items, perPage]);

  const next = () => setPage((p) => Math.min(p + 1, maxPage));
  const prev = () => setPage((p) => Math.max(p - 1, 1));

  const goTo = (num: number) => setPage(Math.min(Math.max(num, 1), maxPage));

  return { page, maxPage, pagedItems, next, prev, goTo };
}

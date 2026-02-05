import { useEffect, useState, useCallback, useMemo, useRef, type UIEvent } from "react";
import { getCategorias, getCategoriasActual } from "../categorias.api";
import type { Categoria } from "../types";
import { useAuth } from "@/hooks/useAuth";
import AddCategoriaButton from "@/features/categorias/components/AddCategoriaButton";
import EditCategoriaButton from "@/features/categorias/components/EditCategoriaButton";
import DeleteCategoriaButton from "@/features/categorias/components/DeleteCategoriaButton";
import { ServerPagination } from "@/components/pagination/ServerPagination";

type SortKey = "id" | "name" | "businessTypeName" | "isActive" | "creationDate";

export default function CategoriaListPage() {
  const { isAdmin, hasRole } = useAuth();
  const isSuper = hasRole("SUPER_ADMIN");
  const canEditDelete = isSuper; // según tu código actual, solo SUPER ve acciones
  const canCreate = isSuper || isAdmin;

  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== Mobile header hide/show on scroll (igual idea que productos) =====
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const lastScrollY = useRef(0);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const tickingRef = useRef(false);

  const handleListScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (tickingRef.current) return;

    tickingRef.current = true;
    requestAnimationFrame(() => {
      const current = el.scrollTop;
      const prev = lastScrollY.current;
      const diff = current - prev;

      const TOP_SHOW_PX = 30;
      const THRESHOLD = 10;

      if (current <= TOP_SHOW_PX) {
        setShowMobileHeader(true);
        lastScrollY.current = current;
        tickingRef.current = false;
        return;
      }

      lastScrollY.current = current;

      if (Math.abs(diff) < THRESHOLD) {
        tickingRef.current = false;
        return;
      }

      setShowMobileHeader(diff < 0);
      tickingRef.current = false;
    });
  };

  // ===== Sort =====
  const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const toggleSort = (key: SortKey) =>
    setLocalSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  const getCreationIso = (c: Categoria): string | undefined =>
    // @ts-expect-error: soportamos ambas llaves
    (c.creationDate as string | undefined) ?? (c.fecha_creacion as string | undefined);

  const formatTimestamp = (ts?: string) =>
    ts
      ? new Date(ts).toLocaleString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      : "-";

  // ===== Load =====
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = isSuper ? await getCategorias() : await getCategoriasActual();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar categorías");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isSuper]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ===== Client-side pagination =====
  const [pageUI, setPageUI] = useState(1);
  const [size, setSize] = useState(10);

  useEffect(() => {
    // cuando cambian items o sort, reset al inicio
    setPageUI(1);
    listScrollRef.current?.scrollTo({ top: 0 });
    lastScrollY.current = 0;
    setShowMobileHeader(true);
  }, [items.length, localSort.key, localSort.dir]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    const { key, dir } = localSort;
    const mult = dir === "asc" ? 1 : -1;

    return arr.sort((a, b) => {
      switch (key) {
        case "id": {
          const an = Number(a.id ?? 0);
          const bn = Number(b.id ?? 0);
          return (an - bn) * mult;
        }
        case "isActive": {
          const an = a.isActive ? 1 : 0;
          const bn = b.isActive ? 1 : 0;
          return (an - bn) * mult;
        }
        case "creationDate": {
          const at = getCreationIso(a) ? new Date(getCreationIso(a)!).getTime() : 0;
          const bt = getCreationIso(b) ? new Date(getCreationIso(b)!).getTime() : 0;
          return (at - bt) * mult;
        }
        case "businessTypeName":
          return collator.compare(String(a.businessTypeName ?? ""), String(b.businessTypeName ?? "")) * mult;
        case "name":
        default:
          return collator.compare(String(a.name ?? ""), String(b.name ?? "")) * mult;
      }
    });
  }, [items, localSort, collator]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / size));
  const pagedItems = useMemo(() => {
    const start = (pageUI - 1) * size;
    const end = start + size;
    return sortedItems.slice(start, end);
  }, [sortedItems, pageUI, size]);

  const isEmpty = !loading && pagedItems.length === 0;

  if (loading) return <p className="p-4">Cargando…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  const Arrow = ({ k }: { k: SortKey }) =>
    localSort.key !== k ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? <>▲</> : <>▼</>;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* ===== MOBILE HEADER FIJO ===== */}
      <div
        className={`
          md:hidden
          fixed top-[64px] left-0 right-0 z-40
          bg-white border-b shadow-sm
          transition-transform duration-300 ease-out
          ${showMobileHeader ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="px-3 pt-3 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 truncate">Categorías</h1>
              <p className="text-xs text-slate-500">Administra tus categorías</p>
            </div>

            {canCreate && <AddCategoriaButton onCreated={() => loadData()} />}
          </div>

          {/* Sort + size (mobile) */}
          <div className="grid grid-cols-2 gap-3">
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
              value={localSort.key}
              onChange={(e) => setLocalSort((s) => ({ ...s, key: e.target.value as SortKey }))}
            >
              <option value="name">Nombre</option>
              <option value="id">ID</option>
              <option value="businessTypeName">Tipo de negocio</option>
              <option value="isActive">Activo</option>
              {isSuper && <option value="creationDate">Fecha creación</option>}
            </select>

            <button
              className="h-11 rounded-2xl bg-slate-100 text-slate-700 font-semibold shadow-sm hover:bg-slate-200 transition"
              onClick={() => setLocalSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))}
            >
              Orden: {localSort.dir === "asc" ? "Asc ▲" : "Desc ▼"}
            </button>

            <select
              className="col-span-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP HEADER ===== */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categorías</h1>
          <p className="text-sm text-slate-600">Ordena, edita y administra tus categorías</p>
        </div>
        {canCreate && <AddCategoriaButton onCreated={() => loadData()} />}
      </div>

      {/* ===== MOBILE LIST (cards) ===== */}
      <div
        ref={listScrollRef}
        onScroll={handleListScroll}
        className="
          md:hidden
          pt-[170px]
          pb-[calc(72px+env(safe-area-inset-bottom))]
          overflow-y-auto
          overflow-x-hidden
          w-full max-w-full
          h-[calc(100dvh-64px)]
          overscroll-contain
          touch-pan-y
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {isEmpty ? (
          <div className="bg-white border rounded-2xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-lg font-semibold text-slate-900">Sin resultados</h3>
            <p className="text-sm text-slate-500 mt-1">No hay categorías para mostrar.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 w-full max-w-full">
            {pagedItems.map((c) => (
              <li
                key={`mobile-${c.id}`}
                className="w-full max-w-full rounded-2xl border bg-white p-4 shadow-sm overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base text-slate-900 truncate">{c.name}</p>

                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-slate-500 flex min-w-0 gap-1">
                        <span className="shrink-0">ID:</span>
                        <span className="min-w-0 truncate text-slate-700">{String(c.id ?? "-")}</span>
                      </p>

                      <p className="text-xs text-slate-500 flex min-w-0 gap-1">
                        <span className="shrink-0">Tipo:</span>
                        <span className="min-w-0 truncate text-slate-700">{c.businessTypeName ?? "-"}</span>
                      </p>

                      {isSuper && (
                        <p className="text-[11px] text-slate-500 flex min-w-0 gap-1">
                          <span className="shrink-0">Creación:</span>
                          <span className="min-w-0 truncate text-slate-700">{formatTimestamp(getCreationIso(c))}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">Activo</p>
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shrink-0
                        ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                      `}
                    >
                      {c.isActive ? "Sí" : "No"}
                    </span>
                  </div>
                </div>

                {canEditDelete && (
                  <div className="mt-3 flex items-center justify-end gap-3">
                    <EditCategoriaButton id={c.id} onUpdated={() => loadData()} />
                    <DeleteCategoriaButton id={c.id} name={c.name} onDeleted={() => loadData()} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== PAGINACIÓN MOBILE (FIJA) ===== */}
      <div
        className="
          md:hidden
          fixed bottom-0 left-0 right-0 z-40
          bg-white border-t shadow-sm
          px-3 py-2
        "
      >
        <ServerPagination
          page={pageUI}
          totalPages={totalPages}
          onChange={(nextPage) => {
            setPageUI(nextPage);
            listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>

      {/* ===== DESKTOP TABLE ===== */}
      <div className="hidden md:block rounded-2xl border bg-white shadow-sm overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm text-gray-700">
          <thead className="bg-slate-50 border-b sticky top-0 z-10">
            <tr className="text-xs uppercase tracking-wide text-gray-700">
              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("id")} className="flex items-center gap-1 font-medium hover:text-blue-600">
                  ID <Arrow k="id" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 font-medium hover:text-blue-600">
                  Nombre <Arrow k="name" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => toggleSort("businessTypeName")}
                  className="flex items-center gap-1 font-medium hover:text-blue-600"
                >
                  Tipo de negocio <Arrow k="businessTypeName" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => toggleSort("isActive")}
                  className="flex items-center gap-1 font-medium hover:text-blue-600"
                >
                  Activo <Arrow k="isActive" />
                </button>
              </th>

              {isSuper && (
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("creationDate")}
                    className="flex items-center gap-1 font-medium hover:text-blue-600"
                  >
                    Fecha creación <Arrow k="creationDate" />
                  </button>
                </th>
              )}

              {canEditDelete && <th className="px-4 py-3 text-left">Acciones</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {pagedItems.length === 0 ? (
              <tr>
                <td colSpan={isSuper ? (canEditDelete ? 6 : 5) : 4} className="px-4 py-10 text-center text-gray-500">
                  Sin resultados
                </td>
              </tr>
            ) : (
              pagedItems.map((c) => (
                <tr key={`desktop-${c.id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">{c.id}</td>
                  <td className="px-4 py-3 max-w-[260px] truncate">{c.name}</td>
                  <td className="px-4 py-3 max-w-[260px] truncate">{c.businessTypeName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                        ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                      `}
                    >
                      {c.isActive ? "Sí" : "No"}
                    </span>
                  </td>

                  {isSuper && <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(getCreationIso(c))}</td>}

                  {canEditDelete && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <EditCategoriaButton id={c.id} onUpdated={() => loadData()} />
                        <DeleteCategoriaButton id={c.id} name={c.name} onDeleted={() => loadData()} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINACIÓN DESKTOP ===== */}
      <div className="hidden md:flex pt-2 items-center justify-between">
        <div className="text-sm text-slate-500">
          Página <span className="font-semibold text-slate-700">{pageUI}</span> de{" "}
          <span className="font-semibold text-slate-700">{totalPages}</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="h-10 rounded-xl border px-3 text-sm bg-white"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <ServerPagination
            page={pageUI}
            totalPages={totalPages}
            onChange={(nextPage) => setPageUI(nextPage)}
          />
        </div>
      </div>
    </div>
  );
}
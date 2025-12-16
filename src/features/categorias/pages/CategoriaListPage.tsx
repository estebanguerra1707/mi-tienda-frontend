import { useEffect, useState, useCallback  } from "react";
import { getCategorias, getCategoriasActual } from "../categorias.api";
import type { Categoria } from "../types";
import { useAuth } from "@/hooks/useAuth"; 
import AddCategoriaButton from "@/features/categorias/components/AddCategoriaButton";
import EditCategoriaButton from "@/features/categorias/components/EditCategoriaButton";
import DeleteCategoriaButton from "@/features/categorias/components/DeleteCategoriaButton";


export default function CategoriaListPage() {
  type SortKey = "id" | "name" | "businessTypeName" | "isActive" | "creationDate";

const [localSort, setLocalSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
  key: "name",
  dir: "asc",
});

const toggleSort = (key: SortKey) =>
  setLocalSort((s) =>
    s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
  );
const collator = new Intl.Collator("es", { sensitivity: "base" });

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

    
  const { hasRole } = useAuth();
  const isSuper = hasRole("SUPER_ADMIN");

  const [items, setItems] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
    try {
        setLoading(true);
        setError(null);

        // SUPER_ADMIN → /categorias ; resto → /categorias/actual
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

  if (loading) return <p className="p-4">Cargando…</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

    const sortedItems = [...items].sort((a, b) => {
    const { key, dir } = localSort;
    const mult = dir === "asc" ? 1 : -1;

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
        case "businessTypeName": {
        return collator.compare(String(a.businessTypeName ?? ""), String(b.businessTypeName ?? "")) * mult;
        }
        case "name":
        default: {
        return collator.compare(String(a.name ?? ""), String(b.name ?? "")) * mult;
        }
    }
    });
  
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

    {/* HEADER */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
        Categorías
      </h1>

      {isSuper && (
        <div>
          <AddCategoriaButton onCreated={() => loadData()} />
        </div>
      )}
    </div>

    {/* TABLE WRAPPER (para móviles → scroll horizontal limpio) */}
    <div className="
      overflow-x-auto 
      bg-white 
      rounded-xl 
      shadow-sm 
      border border-gray-200
    ">
      <table className="min-w-full text-sm text-gray-700">
        
        {/* TABLE HEADER */}
        <thead>
          <tr className="
            bg-gray-50 
            border-b 
            text-gray-700 
            text-xs 
            uppercase 
            tracking-wide
          ">
            <th className="px-4 py-3 text-left">
              <button
                onClick={() => toggleSort('id')}
                className="flex items-center gap-1 font-medium hover:text-blue-600"
              >
                ID {localSort.key !== 'id' ? '↕︎' : localSort.dir === 'asc' ? '▲' : '▼'}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => toggleSort('name')}
                className="flex items-center gap-1 font-medium hover:text-blue-600"
              >
                Nombre {localSort.key !== 'name' ? '↕︎' : localSort.dir === 'asc' ? '▲' : '▼'}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <button
                onClick={() => toggleSort('businessTypeName')}
                className="flex items-center gap-1 font-medium hover:text-blue-600"
              >
                Tipo de negocio {localSort.key !== 'businessTypeName' ? '↕︎' : localSort.dir === 'asc' ? '▲' : '▼'}
              </button>
            </th>

            <th className="px-4 py-3 text-left">
              <span className="font-medium">Activo</span>
            </th>

            {isSuper && (
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => toggleSort('creationDate')}
                  className="flex items-center gap-1 font-medium hover:text-blue-600"
                >
                  Fecha creación {localSort.key !== 'creationDate' ? '↕︎' : localSort.dir === 'asc' ? '▲' : '▼'}
                </button>
              </th>
            )}

            {isSuper && <th className="px-4 py-3 text-left">Acciones</th>}
          </tr>
        </thead>

        {/* TABLE BODY */}
        <tbody className="divide-y divide-gray-200">
          {sortedItems.length === 0 ? (
            <tr>
              <td
                colSpan={isSuper ? 6 : 4}
                className="px-4 py-8 text-center text-gray-500 text-sm"
              >
                Sin resultados
              </td>
            </tr>
          ) : (
            sortedItems.map((c) => (
              <tr
                key={c.id}
                className="
                  hover:bg-gray-50 
                  transition-colors
                "
              >
                <td className="px-4 py-3 whitespace-nowrap">{c.id}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{c.name}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{c.businessTypeName}</td>

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

                {isSuper && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatTimestamp(getCreationIso(c))}
                  </td>
                )}

                {isSuper && (
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
  </div>
  );
}

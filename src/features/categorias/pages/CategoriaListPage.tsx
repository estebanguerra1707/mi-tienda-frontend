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
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-6 space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Categorías</h1>
        {isSuper && (
        <div className="sm:order-2">
            <AddCategoriaButton onCreated={() => loadData()} />
        </div>
        )}
    </div>
      <table className="w-full border-collapse border">
        <thead className="sticky top-0 bg-slate-50 z-10">
        <tr className="[&>th]:text-left [&>th]:px-3 [&>th]:py-2">
            <th>
            <button onClick={() => toggleSort("id")} className="flex items-center gap-1">
                ID {localSort.key !== "id" ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? "▲" : "▼"}
            </button>
            </th>
            <th>
            <button onClick={() => toggleSort("name")} className="flex items-center gap-1">
                Nombre {localSort.key !== "name" ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? "▲" : "▼"}
            </button>
            </th>
            <th>
            <button onClick={() => toggleSort("businessTypeName")} className="flex items-center gap-1">
                Tipo de negocio{" "}
                {localSort.key !== "businessTypeName" ? (
                <span className="opacity-40">↕︎</span>
                ) : localSort.dir === "asc" ? (
                "▲"
                ) : (
                "▼"
                )}
            </button>
            </th>
            <th>
            <button className="flex items-center gap-1">
                Activo
            </button>
            </th>
            {isSuper && (
            <th>
                <button onClick={() => toggleSort("creationDate")} className="flex items-center gap-1">
                Fecha creación{" "}
                {localSort.key !== "creationDate" ? <span className="opacity-40">↕︎</span> : localSort.dir === "asc" ? "▲" : "▼"}
                </button>
            </th>
            )}
            {isSuper && <th className="w-40">Acciones</th>}
        </tr>
        </thead>
        <tbody>
          {sortedItems.length === 0 ? (
                <tr>
                    <td colSpan={isSuper ? 6 : 4} className="px-3 py-6 text-center text-slate-500">
                    Sin resultados
                    </td>
                </tr>
                ) : (
                sortedItems.map((c) => (
                    <tr key={c.id} className="border-t [&>td]:px-3 [&>td]:py-2 hover:bg-slate-50">
                    <td className="whitespace-nowrap">{c.id}</td>
                    <td className="truncate">{c.name}</td>
                    <td className="truncate">{c.businessTypeName}</td>
                    <td className="whitespace-nowrap">{c.isActive ? "Sí" : "No"}</td>
                    {isSuper && <td className="whitespace-nowrap">{formatTimestamp(getCreationIso(c))}</td>}
                    {isSuper && (
                        <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
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
  );
}

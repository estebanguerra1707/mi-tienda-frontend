import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Proveedor } from "../types";
import EditProveedorButton from "../components/EditProveedorButton";
import DeleteProveedorButton from "../components/DeleteProveedorButton";
import { useProveedoresList } from "../useProveedores";
import { useAuth } from "@/hooks/useAuth";

/* ================== ORDENAMIENTO ================== */
type SortKey = "id" | "name" | "email";

const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : "No se pudieron cargar proveedores.";

export default function ProveedorListPage() {
  const { data = [], isLoading, error, refetch, isFetching } = useProveedoresList();
  const { user } = useAuth();

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );

  const Arrow = ({ k }: { k: SortKey }) =>
    sort.key !== k ? (
      <span className="opacity-40">↕︎</span>
    ) : sort.dir === "asc" ? (
      <span aria-label="asc">▲</span>
    ) : (
      <span aria-label="desc">▼</span>
    );

  const collator = useMemo(() => new Intl.Collator("es", { sensitivity: "base" }), []);

  const sortedData = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[sort.key] as Proveedor[SortKey];
      const bv = b[sort.key] as Proveedor[SortKey];

      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;

      if (sort.key === "id") return (Number(av) - Number(bv)) * dir;
      return collator.compare(String(av), String(bv)) * dir;
    });
  }, [data, sort, collator]);

  const reload = () => void refetch();
  
  const isSuperAdmin = useMemo(() => {
  // Opción A: si tu user trae role: "SUPER_ADMIN"
  if (user?.role === "SUPER_ADMIN") return true;
  return false;
}, [user]);

  const canEditOrDeleteProveedor = (p: Proveedor) => {
    if (isSuperAdmin) return true;
    const sucursales = p.sucursales ?? [];
    if (sucursales.length !== 1) return false;
    if (!user?.branchId) return false;

    return sucursales[0].id === user.branchId;
  };
  
  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ===== Sticky top bar (MÓVIL) ===== */}
      <div className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b -mx-3 px-3 pt-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">Proveedores</h1>
            <p className="text-xs text-slate-500 leading-tight">Gestiona tus proveedores</p>
          </div>

          <div className="shrink-0">
            <Link
              to="/proveedores/nuevo"
              className="h-10 px-4 rounded-2xl bg-blue-600 text-white font-semibold flex items-center justify-center active:scale-[0.99] transition shadow-sm"
            >
              + Nuevo
            </Link>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={reload}
            className="flex-1 h-10 rounded-2xl bg-slate-100 text-slate-900 font-semibold active:scale-[0.99] transition"
          >
            🔄 {isFetching ? "Actualizando…" : "Recargar"}
          </button>

          <button
            type="button"
            onClick={() => toggleSort("name")}
            className="flex-1 h-10 rounded-2xl bg-slate-100 text-slate-900 font-semibold active:scale-[0.99] transition"
            title="Ordenar por nombre"
          >
            Ordenar: Nombre {sort.key === "name" ? (sort.dir === "asc" ? "▲" : "▼") : "↕︎"}
          </button>
        </div>
      </div>

      {/* ===== Header (DESKTOP/TABLET) ===== */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Proveedores</h1>
          <p className="text-sm text-slate-600">Crea, edita y elimina proveedores</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            className="h-11 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition font-semibold"
          >
            🔄 {isFetching ? "Actualizando…" : "Recargar"}
          </button>

          <Link
            to="/proveedores/nuevo"
            className="h-11 px-5 rounded-2xl bg-blue-600 text-white font-semibold flex items-center justify-center hover:bg-blue-700 transition shadow-sm"
          >
            + Nuevo proveedor
          </Link>
        </div>
      </div>

      {/* ===== Estados ===== */}
      {isLoading && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-slate-700">Cargando…</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-red-700 font-medium">{errorMessage(error)}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 h-10 px-4 rounded-xl bg-red-600 text-white font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ===== MOBILE: CARDS ===== */}
      {!isLoading && !error && (
        <ul className="grid gap-3 md:hidden">
          {sortedData.map((p) => (
            <li
              key={`mobile-${p.id}`}
              className="rounded-2xl border bg-white p-4 shadow-sm active:scale-[0.995] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-base text-slate-900 truncate">{p.name}</p>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-slate-500">
                      Correo: <span className="text-slate-700">{p.email ?? "—"}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Contacto: <span className="text-slate-700">{p.contact ?? "—"}</span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-slate-400 font-mono">#{p.id}</span>
              </div>
                {canEditOrDeleteProveedor(p) ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <EditProveedorButton id={p.id} />
                  <DeleteProveedorButton id={p.id} name={p.name} />
                </div>
                ): (
                    <div className="mt-4">
                      <span
                        title="Este proveedor pertenece a más de una sucursal"
                        className="
                          inline-flex items-center justify-center
                          w-full h-10
                          rounded-xl
                          text-sm font-semibold
                          bg-slate-100 text-slate-600
                          border border-slate-200
                        "
                      >
                        Proveedor MultiSucursal
                      </span>
                    </div>
                  )}
            </li>
          ))}

          {!sortedData.length && (
            <li className="rounded-2xl border bg-white p-6 text-center text-slate-500 shadow-sm">
              Sin proveedores registrados.
            </li>
          )}
        </ul>
      )}

      {/* ===== DESKTOP: TABLA ===== */}
      {!isLoading && !error && (
        <div className="hidden md:block rounded-2xl border bg-white shadow-sm overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-50 border-b sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("id")}
                    className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  >
                    ID <Arrow k="id" />
                  </button>
                </th>

                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Nombre <Arrow k="name" />
                  </button>
                </th>

                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("email")}
                    className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Correo <Arrow k="email" />
                  </button>
                </th>

                <th className="px-4 py-3 text-left font-semibold text-slate-700">Contacto</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {sortedData.map((p) => (
                <tr key={`desktop-${p.id}`} className="border-t hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-mono text-slate-600">{p.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3">{p.email ?? "—"}</td>
                  <td className="px-4 py-3">{p.contact ?? "—"}</td>
                  <td className="px-4 py-3">
                    {canEditOrDeleteProveedor(p) ? (
                      <div className="flex items-center gap-4">
                       <EditProveedorButton id={p.id} />
                       <DeleteProveedorButton id={p.id} name={p.name} />
                      </div>
                    ): (
                      <span className="
                        inline-flex items-center
                        px-2 py-1
                        rounded-full
                        text-xs font-semibold
                        bg-slate-100 text-slate-600
                        border border-slate-200
                      ">
                        Proveedor MultiSucursal
                      </span>
                      )}
                    
                  </td>
                </tr>
              ))}

              {!sortedData.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Sin proveedores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="h-[max(12px,env(safe-area-inset-bottom))] md:hidden" />
    </div>
  );
}

import { useEffect, useState } from "react";
import { getSucursales } from "../sucursales.api";
import { Sucursal } from "../types";
import { useAuth } from "@/hooks/useAuth";
import AddSucursalButton from "@/features/sucursales/components/AddSucursalButton";
import EditSucursalButton from "@/features/sucursales/components/EditSucursalButton";
import DeleteSucursalButton from "@/features/sucursales/components/DeleteSucursalButton";


export default function SucursalListPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { hasRole } = useAuth();
  const isSuper = hasRole("SUPER_ADMIN");

 const loadData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await getSucursales();
    setSucursales(data);
  } catch (e) {
    console.warn(e);
    setError("No se pudieron cargar las sucursales.");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight truncate">
            Sucursales
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Administra tus sucursales registradas
          </p>
        </div>

        {isSuper && (
          <div className="w-full sm:w-auto">
            <AddSucursalButton onCreated={loadData} />
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-2xl border border-red-300 bg-red-50 text-red-700 shadow-sm">
          {error}
          <button
            type="button"
            onClick={loadData}
            className="mt-3 h-10 px-4 rounded-xl bg-red-600 text-white font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && !error && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-slate-700">Cargando…</p>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && sucursales.length === 0 && (
        <div className="rounded-2xl border bg-white p-6 text-center text-slate-500 shadow-sm">
          Sin sucursales registradas.
        </div>
      )}

      {/* 📱 MOBILE: CARDS */}
      {!loading && !error && sucursales.length > 0 && (
        <div className="md:hidden bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y">
            {sucursales.map((s) => (
              <div key={s.id} className="p-4 space-y-3 active:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 break-words">{s.name}</p>
                    <p className="text-sm text-slate-600 break-words">{s.address}</p>
                    <p className="text-sm text-slate-600">{s.phone ?? "—"}</p>

                    {isSuper && (
                      <p className="mt-2 text-xs text-slate-500">
                        Tipo de negocio:{" "}
                        <span className="text-slate-700 font-medium">
                          {s.businessTypeName ?? "—"}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-slate-400 font-mono">#{s.id}</span>

                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>

                {isSuper && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="w-full [&>button]:w-full [&>button]:h-11 [&>button]:rounded-2xl [&>button]:bg-slate-200 [&>button]:text-black [&>button]:font-semibold [&>button]:transition">
                      <EditSucursalButton id={s.id} onUpdated={loadData} />
                    </div>

                    <div className="w-full [&>button]:w-full [&>button]:h-11 [&>button]:rounded-2xl [&>button]:bg-red-600 [&>button]:text-white [&>button]:hover:bg-red-700 [&>button]:font-semibold [&>button]:transition">
                      <DeleteSucursalButton id={s.id} name={s.name} onDeleted={loadData} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🖥 DESKTOP: TABLE */}
      {!loading && !error && sucursales.length > 0 && (
        <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
          <table className="min-w-[1100px] w-full text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide border-b">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Dirección</th>
                <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                {isSuper && (
                  <th className="px-4 py-3 text-left font-semibold">Tipo de negocio</th>
                )}
                <th className="px-4 py-3 text-left font-semibold">Activo</th>
                {isSuper && <th className="px-4 py-3 text-right font-semibold w-44">Acciones</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {sucursales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                    {s.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[240px] truncate">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 max-w-[340px] truncate">{s.address}</td>
                  <td className="px-4 py-3">{s.phone ?? "—"}</td>

                  {isSuper && <td className="px-4 py-3">{s.businessTypeName ?? "—"}</td>}

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.active ? "Sí" : "No"}
                    </span>
                  </td>

                  {isSuper && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-3">
                        <EditSucursalButton id={s.id} onUpdated={loadData} />
                        <DeleteSucursalButton id={s.id} name={s.name} onDeleted={loadData} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="h-[max(12px,env(safe-area-inset-bottom))] md:hidden" />
    </div>
  );

}

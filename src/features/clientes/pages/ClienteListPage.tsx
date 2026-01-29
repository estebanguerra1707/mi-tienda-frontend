import { useState } from "react";
import AddClienteButton from "../components/AddClienteButton";
import EditClienteButton from "../components/EditClienteButton";
import DeleteClienteButton from "../components/DeleteClienteButton";
import { useClientesPage } from "../useClients";
import { useAuth } from "@/hooks/useAuth";
import type { ClienteResponseDTO } from "../types";

export default function ClienteListPage() {
  const [page, setPage] = useState<number>(0);
  const size = 10;
  const { user } = useAuth();

  const { data, isLoading, isError } = useClientesPage({
    page,
    size,
  });

  const items: ClienteResponseDTO[] = data?.content ?? [];
  const totalPages: number = data?.totalPages ?? 0;

  const canEditOrDeleteCliente = (c: ClienteResponseDTO): boolean =>
    !c.multiSucursal && c.sucursalId === user?.branchId;

  return (
    <div className="min-h-screen bg-slate-50 px-3 sm:px-6 py-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-4">

        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-slate-600">
              Administra tus clientes registrados
            </p>
          </div>
          <AddClienteButton />
        </div>

        {/* CONTENIDO */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">

          {/* ESTADOS */}
          {isLoading ? (
            <div className="p-6 text-slate-600">Cargando clientes…</div>
          ) : isError ? (
            <div className="p-6 text-slate-600">
              Error al cargar clientes
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-slate-600">
              No hay clientes registrados
            </div>
          ) : (
            <>
              {/* 📱 MOBILE / TABLET — CARDS */}
              <div className="block md:hidden divide-y">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 space-y-2 active:bg-slate-50"
                  >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold break-words">
                          {c.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {c.phone ?? "Sin teléfono"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {c.email ?? "Sin correo"}
                        </p>
                      </div>

                      {canEditOrDeleteCliente(c) ? (
                        <div className="flex gap-2 sm:shrink-0">
                          <EditClienteButton id={c.id} />
                          <DeleteClienteButton id={c.id} name={c.name} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Multisucursal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 🖥 DESKTOP — TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Nombre</th>
                      <th className="p-3 text-left">Teléfono</th>
                      <th className="p-3 text-left">Correo</th>
                      <th className="p-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id} className="border-t hover:bg-slate-50">
                        <td className="p-3">{c.id}</td>
                        <td className="p-3">{c.name}</td>
                        <td className="p-3">{c.phone ?? "-"}</td>
                        <td className="p-3">{c.email ?? "-"}</td>
                        <td className="p-3 flex gap-2">
                          {canEditOrDeleteCliente(c) ? (
                            <>
                              <EditClienteButton id={c.id} />
                              <DeleteClienteButton id={c.id} name={c.name} />
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Multisucursal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              <div className="flex items-center justify-between p-4 border-t">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-sm text-blue-600 disabled:opacity-40"
                >
                  Anterior
                </button>

                <span className="text-sm text-slate-600">
                  Página {page + 1} de {totalPages}
                </span>

                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-sm text-blue-600 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

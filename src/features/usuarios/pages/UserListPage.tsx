// src/features/usuarios/pages/UsersListPage.tsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { useDeleteUser } from "@/features/usuarios/useDeleteUser";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { User } from "../users.service";

export default function UsersListPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const q = sp.get("q") ?? "";

  const { data, isLoading, error } = useUsers();

  const filtered: User[] = useMemo(() => {
    const list: User[] = Array.isArray(data) ? data : [];
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (u) =>
        (u.username ?? "").toLowerCase().includes(needle) ||
        (u.email ?? "").toLowerCase().includes(needle)
    );
  }, [data, q]);

  const del = useDeleteUser();

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setOpen(true);
  };

  const confirmDelete = () => {
    if (selectedId != null) {
      del.mutate(selectedId, { onSettled: () => setOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <button
          onClick={() => navigate("/usuarios/nuevo")}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white"
        >
          Nuevo usuario
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          placeholder="Buscar por nombre o email…"
          className="border rounded-lg px-3 py-2 w-72"
          defaultValue={q}
          onChange={(e) => {
            const s = new URLSearchParams(sp);
            s.set("q", e.target.value);
            setSp(s, { replace: true });
          }}
        />
      </div>

      {error && (
        <div className="p-3 rounded border border-red-300 text-red-700 bg-red-50">
          Error al cargar usuarios
        </div>
      )}

      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2 w-40 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-3 py-6 text-center" colSpan={4}>
                  Cargando…
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Link
                      to={`/usuarios/${u.id}/editar`}
                      className="px-2 py-1 rounded border"
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      disabled={del.isPending}
                      className="px-2 py-1 rounded border text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-slate-500 text-center" colSpan={4}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={open}
        title="Eliminar usuario"
        message="Esta acción desactivará al usuario. ¿Deseas continuar?"
        confirmText="Eliminar"
        loading={del.isPending}
        onClose={() => setOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { useDeleteUser } from "@/features/usuarios/useDeleteUser";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { User } from "../users.service";

type SortKey = "username" | "email" | "role" | "branchName";


export default function UsersListPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const q = sp.get("q") ?? "";

  const { data, isLoading, error } = useUsers();
  
 const [localSort, setLocalSort] = useState<{
  key: SortKey;
  dir: "asc" | "desc";
}>({
  key: "username",
  dir: "asc",
});

const toggleSort = (key: SortKey) =>
  setLocalSort((s) =>
    s.key === key
      ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "asc" }
  );

const collator = useMemo(
  () => new Intl.Collator("es", { sensitivity: "base" }),
  []
);

const Arrow = ({ k }: { k: SortKey }) =>
  localSort.key !== k ? (
    <span className="opacity-40">↕︎</span>
  ) : localSort.dir === "asc" ? (
    <>▲</>
  ) : (
    <>▼</>
  );

const filtered: User[] = useMemo(() => {
  const list: User[] = Array.isArray(data) ? data : [];

  const filteredList = q
    ? list.filter((u) => {
        const needle = q.toLowerCase();
        return (
          (u.username ?? "").toLowerCase().includes(needle) ||
          (u.email ?? "").toLowerCase().includes(needle)
        );
      })
    : list;

  const mult = localSort.dir === "asc" ? 1 : -1;

  return [...filteredList].sort((a, b) => {
    const key = localSort.key;
    return collator.compare(
      String(a[key] ?? ""),
      String(b[key] ?? "")
    ) * mult;
  });
}, [data, q, localSort, collator]);
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
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
        Usuarios
      </h1>

      <button
        onClick={() => navigate("/usuarios/nuevo")}
        className="
          bg-blue-600 text-white 
          px-5 py-2.5 
          rounded-lg 
          font-medium 
          hover:bg-blue-700 
          transition 
          shadow-sm
        "
      >
        Nuevo usuario
      </button>
    </div>

    {/* BUSCADOR */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <input
        placeholder="Buscar por nombre o email…"
        className="
          border border-gray-300 
          rounded-lg 
          px-4 py-2.5 
          w-full sm:w-80 
          text-gray-800 
          shadow-sm 
          focus:ring-2 focus:ring-blue-500 
          focus:border-blue-500
          transition
        "
        defaultValue={q}
        onChange={(e) => {
          const s = new URLSearchParams(sp);
          s.set("q", e.target.value);
          setSp(s, { replace: true });
        }}
      />
    </div>

    {/* ERROR */}
    {error && (
      <div className="
        p-4 rounded-lg 
        border border-red-300 
        bg-red-50 
        text-red-700 
        shadow-sm
      ">
        Error al cargar usuarios
      </div>
    )}

    {/* TABLE WRAPPER */}
    <div className="
      overflow-x-auto 
      bg-white 
      rounded-xl 
      shadow 
      border border-gray-200
    ">
      <table className="min-w-full text-sm text-gray-700">
        <thead>
          <tr className="
            bg-gray-50 
            text-gray-600 
            uppercase 
            text-xs 
            tracking-wide 
            border-b
          ">
            <th className="px-4 py-3 text-left font-semibold">
              <button
                onClick={() => toggleSort("username")}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Nombre <Arrow k="username" />
              </button>
            </th>

            <th className="px-4 py-3 text-left font-semibold">
              <button
                onClick={() => toggleSort("email")}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Email <Arrow k="email" />
              </button>
            </th>

            <th className="px-4 py-3 text-left font-semibold">
              <button
                onClick={() => toggleSort("role")}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Rol <Arrow k="role" />
              </button>
            </th>

            <th className="px-4 py-3 text-left font-semibold">
              <button
                onClick={() => toggleSort("branchName")}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Sucursal <Arrow k="branchName" />
              </button>
            </th>
            <th className="px-4 py-3 text-right font-semibold w-40">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {/* LOADING */}
          {isLoading && (
            <tr>
              <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                Cargando…
              </td>
            </tr>
          )}

          {/* ROWS */}
          {!isLoading &&
            filtered.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.branchName}</td>

                {/* ACCIONES */}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">

                    <Link
                      to={`/usuarios/${u.id}/editar`}
                      className="
                        px-3 py-1.5 
                        rounded-lg 
                        border border-gray-300 
                        text-gray-700 
                        hover:bg-gray-100 
                        transition
                      "
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      disabled={del.isPending}
                      className="
                        px-3 py-1.5 
                        rounded-lg 
                        border border-red-300 
                        text-red-600 
                        hover:bg-red-50 
                        disabled:opacity-50
                        transition
                      "
                    >
                      Eliminar
                    </button>

                  </div>
                </td>
              </tr>
            ))}

          {/* EMPTY */}
          {!isLoading && filtered.length === 0 && (
            <tr>
              <td
                className="px-4 py-10 text-center text-gray-500"
                colSpan={4}
              >
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* CONFIRM DIALOG */}
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

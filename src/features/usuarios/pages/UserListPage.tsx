import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useUsers } from "@/hooks/useUsers";
import { useDeleteUser } from "@/features/usuarios/useDeleteUser";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { User } from "../users.service";
import { Pencil, Trash2 } from "lucide-react";


type SortKey = "username" | "email" | "role" | "branchName";


export default function UsersListPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const q = sp.get("q") ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const size = Math.max(5, Number(sp.get("size") ?? "10"));
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

const filteredSorted: User[] = useMemo(() => {
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
    return collator.compare(String(a[key] ?? ""), String(b[key] ?? "")) * mult;
  });
}, [data, q, localSort, collator]);

const totalItems = filteredSorted.length;

const totalPages = Math.max(1, Math.ceil(totalItems / size));

const safePage = Math.max(1, Math.min(page, totalPages));

const paged: User[] = useMemo(() => {
  const start = (safePage - 1) * size;
  return filteredSorted.slice(start, start + size);
}, [filteredSorted, safePage, size]);


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
  <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight truncate">
          Usuarios
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Administra usuarios registrados
        </p>
      </div>

      <button
        onClick={() => navigate("/usuarios/nuevo")}
        className="h-11 w-full sm:w-auto bg-blue-600 text-white px-5 rounded-2xl font-semibold hover:bg-blue-700 transition shadow-sm"
      >
        + Nuevo usuario
      </button>
    </div>

    {/* CONTROLES */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <input
        placeholder="Buscar por nombre o email…"
        className="border border-gray-300 rounded-2xl px-4 h-11 w-full sm:w-96 text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        defaultValue={q}
        onChange={(e) => {
          const s = new URLSearchParams(sp);
          s.set("q", e.target.value);
          s.set("page", "1");
          setSp(s, { replace: true });
        }}
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Tamaño</span>
        <select
          value={String(size)}
          onChange={(e) => {
            const s = new URLSearchParams(sp);
            s.set("size", e.target.value);
            s.set("page", "1");
            setSp(s, { replace: true });
          }}
          className="h-11 rounded-2xl border border-gray-300 bg-white px-3 text-sm shadow-sm"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>

    {/* ERROR */}
    {error && (
      <div className="p-4 rounded-2xl border border-red-300 bg-red-50 text-red-700 shadow-sm">
        Error al cargar usuarios
      </div>
    )}

    {/* MOBILE CARDS */}
    <div className="md:hidden bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-6 text-slate-600">Cargando…</div>
      ) : paged.length === 0 ? (
        <div className="p-6 text-slate-600">Sin resultados</div>
      ) : (
        <div className="divide-y">
          {paged.map((u) => (
            <div key={u.id} className="p-4 space-y-3 active:bg-slate-50 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 break-words">{u.username}</p>
                  <p className="text-sm text-slate-600 break-words">{u.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Rol: <span className="text-slate-700 font-medium">{u.role}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Sucursal: <span className="text-slate-700">{u.branchName ?? "—"}</span>
                  </p>
                </div>

                <span className="text-xs text-slate-400 font-mono shrink-0">#{u.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/usuarios/${u.id}/editar`}
                    title="Editar"
                    aria-label="Editar"
                    className="
                      h-11 w-full
                      rounded-2xl
                      bg-slate-200 text-slate-900
                      font-semibold
                      flex items-center justify-center
                      hover:bg-slate-300
                      active:scale-[0.99]
                      transition
                    "
                  >
                    <Pencil className="h-5 w-5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    disabled={del.isPending}
                    title="Eliminar"
                    aria-label="Eliminar"
                    className="
                      h-11 w-full
                      rounded-2xl
                      bg-red-600 text-white
                      font-semibold
                      flex items-center justify-center
                      hover:bg-red-700
                      active:scale-[0.99]
                      disabled:opacity-50
                      transition
                    "
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* DESKTOP TABLE */}
    <div className="hidden md:block overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
      <table className="min-w-[900px] w-full text-sm text-gray-700">
        <thead>
          <tr className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide border-b">
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

            <th className="px-4 py-3 text-right font-semibold w-44">Acciones</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                Cargando…
              </td>
            </tr>
          ) : paged.length === 0 ? (
            <tr>
              <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                Sin resultados
              </td>
            </tr>
          ) : (
            paged.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.branchName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <Link
                      to={`/usuarios/${u.id}/editar`}
                      title="Editar"
                      aria-label="Editar"
                      className="
                        inline-flex items-center justify-center
                        h-9 w-9
                        rounded-xl
                        bg-slate-200 text-slate-900
                        hover:bg-slate-300
                        active:scale-[0.98]
                        transition
                      "
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      disabled={del.isPending}
                      title="Eliminar"
                      aria-label="Eliminar"
                      className="
                        inline-flex items-center justify-center
                        h-9 w-9
                        rounded-xl
                        bg-red-600 text-white
                        hover:bg-red-700
                        active:scale-[0.98]
                        disabled:opacity-50
                        transition
                      "
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* PAGINACIÓN */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="text-xs sm:text-sm text-slate-600">
        Mostrando{" "}
        <span className="font-medium text-slate-800">
          {totalItems === 0 ? 0 : (safePage - 1) * size + 1}
        </span>{" "}
        -{" "}
        <span className="font-medium text-slate-800">
          {Math.min(safePage * size, totalItems)}
        </span>{" "}
        de{" "}
        <span className="font-medium text-slate-800">{totalItems}</span>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2">
        <button
          disabled={safePage <= 1}
          onClick={() => {
            const s = new URLSearchParams(sp);
            s.set("page", String(safePage - 1));
            setSp(s, { replace: true });
          }}
          className="h-11 px-4 rounded-2xl bg-slate-100 text-slate-900 font-semibold disabled:opacity-40 transition"
        >
          Anterior
        </button>

        <span className="text-sm text-slate-600">
          Página <span className="font-semibold">{safePage}</span> de{" "}
          <span className="font-semibold">{totalPages}</span>
        </span>

        <button
          disabled={safePage >= totalPages}
          onClick={() => {
            const s = new URLSearchParams(sp);
            s.set("page", String(safePage + 1));
            setSp(s, { replace: true });
          }}
          className="h-11 px-4 rounded-2xl bg-slate-100 text-slate-900 font-semibold disabled:opacity-40 transition"
        >
          Siguiente
        </button>
      </div>
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

// src/features/usuarios/pages/UserCreatePage.tsx
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import UserForm, { type UserFormValues } from "../components/UserForm";
import { createUser, type Role } from "../users.service";
import { useSucursales } from "@/hooks/useCatalogs";

function getBackendMessage(err: unknown): string | null {
  // Intenta leer: err.response.data.message (Axios style)
  if (typeof err === "object" && err !== null) {
    const maybe = err as {
      response?: { data?: unknown };
    };

    const data = maybe.response?.data;
    if (typeof data === "object" && data !== null) {
      const d = data as { message?: unknown };
      if (typeof d.message === "string" && d.message.trim() !== "") {
        return d.message;
      }
    }
  }
  return null;
}

export default function UserCreatePage() {
  const nav = useNavigate();

  const { data: sucursales, isLoading, error } = useSucursales();

  async function onSubmit(v: UserFormValues) {
    const needsBranch: Record<Role, boolean> = {
      VENDOR: true,
      ADMIN: true,
      SUPER_ADMIN: false,
    };

    if (needsBranch[v.role] && !v.branchId) {
      toast.error("Debes seleccionar una sucursal para este rol.");
      return;
    }

    try {
      await createUser({
        username: v.name,
        email: v.email,
        password: v.password || "",
        role: v.role,
        ...(v.branchId ? { branchId: Number(v.branchId) } : { branchId: null }),
      });

      toast.success("Usuario creado correctamente");
      nav("/usuarios", { replace: true });
    } catch (err) {
      const backendMsg = getBackendMessage(err);
      const fallback = err instanceof Error ? err.message : "No se pudo crear el usuario";
      toast.error(backendMsg ?? fallback);
    }
  }

  if (isLoading) return <p className="p-4">Cargando sucursales…</p>;
  if (error) return <p className="p-4 text-red-600">Error: {(error as Error).message}</p>;

  return (
    <div className="max-w-lg bg-white border rounded-2xl p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Nuevo usuario</h1>
      <UserForm
        onSubmit={onSubmit}
        submitLabel="Crear"
        requirePassword
        sucursales={sucursales ?? []}
      />
    </div>
  );
}

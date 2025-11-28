// src/features/usuarios/pages/UserCreatePage.tsx
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import UserForm, { type UserFormValues } from "../components/UserForm";
import { createUser, type Role } from "../users.service";
import { useSucursales } from "@/hooks/useCatalogs";

export default function UserCreatePage() {
  const nav = useNavigate();

  // catálogo de sucursales
  const {
    data: sucursales,
    isLoading,
    error,
  } = useSucursales();

  async function onSubmit(v: UserFormValues) {
    // Reglas:
    // - VENDOR y ADMIN: sucursal obligatoria
    // - SUPER_ADMIN: puede ir sin sucursal (null)
    const needsBranch: Record<Role, boolean> = {
      VENDOR: true,
      ADMIN: true,
      SUPER_ADMIN: false,
    };

    if (needsBranch[v.role] && !v.branchId) {
      toast.error("Debes seleccionar una sucursal para este rol.");
      return;
    }

    await createUser({
      username: v.name,
      email: v.email,
      password: v.password || "",
      role: v.role,
      ...(v.branchId ? { branchId: Number(v.branchId) } : { branchId: null }),
    });

    toast.success("Usuario creado correctamente");
    nav("/usuarios", { replace: true });
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

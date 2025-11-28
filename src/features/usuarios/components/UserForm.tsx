// src/features/usuarios/components/UserForm.tsx
import { useEffect, useState } from "react";
import type { Sucursal } from "@/hooks/useCatalogs";
import type { Role } from "../users.service";

export type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  branchId?: number;
};

type Props = {
  submitLabel: string;
  onSubmit: (v: UserFormValues) => void;
  requirePassword?: boolean;
  defaultValues?: UserFormValues;
  sucursales: Sucursal[];
   hideBranchForSuper?: boolean;
};

export default function UserForm({
  onSubmit,
  submitLabel,
  requirePassword = false,
  defaultValues,
  sucursales,
  hideBranchForSuper = false,
}: Props) {
  const [form, setForm] = useState<UserFormValues>(
    defaultValues ?? { name: "", email: "", password: "", role: "VENDOR", branchId: undefined }
  );

useEffect(() => {
  if (defaultValues) {
    setForm({
      ...defaultValues,
      branchId:
        defaultValues.branchId != null
          ? Number(defaultValues.branchId)
          : undefined,
    });
  }
}, [defaultValues]);

  const showBranch = !(hideBranchForSuper && form.role === "SUPER_ADMIN");
useEffect(() => {
  if (!showBranch && form.branchId != null) {
    // Limpia branchId solo una vez cuando el campo debe ocultarse
    setForm((f) => ({ ...f, branchId: undefined }));
  }
}, [showBranch, form.branchId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block mb-1 text-sm font-medium">Nombre</label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block mb-1 text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full border rounded-lg px-3 py-2"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
      </div>

      {/* Contraseña (solo crear) */}
      {requirePassword && (
        <div>
          <label className="block mb-1 text-sm font-medium">Contraseña</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2"
            value={form.password ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
      )}

      {/* Rol */}
      <div>
        <label className="block mb-1 text-sm font-medium">Rol</label>
        <select
          className="w-full border rounded-lg px-3 py-2"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
        >
          <option value="VENDOR">Vendedor</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* Sucursal */}
       {showBranch && (
        <div>
          <label className="block mb-1 text-sm font-medium">Sucursal</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={form.branchId ?? ""}
            onChange={(e) => {
                const v = e.target.value;
                // convierte a número o deja undefined si no hay selección
                const next = v === "" ? undefined : Number(v);
                setForm((f) => ({ ...f, branchId: Number.isFinite(next) ? next : undefined }));
            }}
          >
            <option value="">Selecciona una sucursal…</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

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
  <form
    onSubmit={handleSubmit}
    className="
      space-y-6 
      bg-white 
      p-4 sm:p-6 lg:p-8 
      rounded-xl 
      shadow-md 
      border border-gray-200
      max-w-2xl
      mx-auto
    "
  >
    {/* TÍTULO OPCIONAL */}
    {/* <h2 className="text-xl font-semibold text-gray-800">Datos del usuario</h2> */}

    {/* Nombre */}
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Nombre</label>
      <input
        type="text"
        className="
          w-full rounded-lg border border-gray-300 
          px-3 py-2 text-gray-800 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          transition
        "
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
    </div>

    {/* Email */}
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Email</label>
      <input
        type="email"
        className="
          w-full rounded-lg border border-gray-300 
          px-3 py-2 text-gray-800 
          focus:ring-2 focus:ring-blue-500 
          focus:border-blue-500
          transition
        "
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        required
      />
    </div>

    {/* Password solo al crear */}
    {requirePassword && (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Contraseña</label>
        <input
          type="password"
          className="
            w-full rounded-lg border border-gray-300 
            px-3 py-2 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          "
          value={form.password ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
      </div>
    )}

    {/* Rol */}
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Rol</label>
      <select
        className="
          w-full rounded-lg border border-gray-300 
          px-3 py-2 bg-white 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition
        "
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
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Sucursal</label>
        <select
          className="
            w-full rounded-lg border border-gray-300 
            px-3 py-2 bg-white
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          "
          value={form.branchId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
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

    {/* BOTÓN SUBMIT */}
    <div className="pt-4">
      <button
        type="submit"
        className="
          w-full sm:w-auto 
          rounded-lg 
          bg-blue-600 text-white 
          px-5 py-2.5 
          font-medium 
          hover:bg-blue-700 
          transition 
          shadow-sm 
          focus:ring-2 focus:ring-blue-500
        "
      >
        {submitLabel}
      </button>
    </div>
  </form>
);
}

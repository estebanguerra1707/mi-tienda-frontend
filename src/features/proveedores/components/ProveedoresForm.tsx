import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Proveedor } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";

/* ================== SCHEMA ================== */
// ✅ branchIds NO debe ser obligatorio para todos, porque si NO es super admin no se muestra el select.
// Validamos manualmente en el submit cuando sí aplica.
const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  contact: z.string().optional().nullable(),
  email: z.string().email("Correo inválido").optional().nullable(),
  branchIds: z.array(z.number()).optional(),
});

export type ProveedorFormValues = z.infer<typeof schema>;

interface Props {
  initialData?: Proveedor | null;
  onSubmit: (values: ProveedorFormValues) => Promise<void> | void;
  isEditing?: boolean;
}

export default function ProveedorForm({ onSubmit, isEditing }: Props) {
  const { user, hasRole } = useAuth();
  const isSuper =
    (hasRole ? hasRole("SUPER_ADMIN") : user?.role === "SUPER_ADMIN") ?? false;
  const isADMIN =
    (hasRole ? hasRole("ADMIN") : user?.role === "ADMIN") ?? false;

  const {
    data: branches = [],
    isLoading: branchesLoading,
  } = useBranches({
    isSuper,
    businessTypeId: null,
    oneBranchId: !isSuper ? (user?.branchId ?? null) : null,
  });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      branchIds: [],
    },
  });

  const handleValidSubmit = async (values: ProveedorFormValues) => {
    const finalBranchIds = isSuper
      ? (values.branchIds ?? [])
      : user?.branchId
        ? [user.branchId]
        : [];

    if (isSuper && isADMIN && finalBranchIds.length === 0) {
      setError("branchIds", {
        type: "manual",
        message: "Selecciona al menos una sucursal",
      });
      return;
    }

    const payload: ProveedorFormValues = {
      ...values,
      branchIds: finalBranchIds,
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="
        grid gap-4
        bg-white
        p-4 sm:p-6
        rounded-xl
        border
        shadow-sm
        max-w-xl
        mx-auto
      "
    >
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Contacto */}
      <div>
        <label className="block text-sm font-medium mb-1">Contacto</label>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          {...register("contact")}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Correo</label>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      {isSuper && (
        <div>
          <label className="block text-sm font-medium mb-1">Sucursales</label>

          <Controller
            name="branchIds"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <select
                multiple
                ref={field.ref}
                onBlur={field.onBlur}
                disabled={branchesLoading}
                value={(field.value ?? []).map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) =>
                    Number(o.value)
                  );
                  field.onChange(selected);
                }}
                className="w-full min-h-[120px] rounded-lg border px-3 py-2 bg-gray-50"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          />

          {errors.branchIds && (
            <p className="text-xs text-red-600 mt-1">
              {errors.branchIds.message}
            </p>
          )}
        </div>
      )}

      {!isSuper && user?.branchId && (
        <div className="text-sm text-slate-600 bg-slate-100 rounded-lg px-3 py-2">
          Sucursal asignada:{" "}
          <strong>
            {branchesLoading
              ? "Cargando…"
              : branches.find((b) => b.id === user.branchId)?.name ?? "Sucursal asignada"}
          </strong>
        </div>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full sm:w-auto
          px-6 py-2
          rounded-lg
          bg-blue-600
          text-white
          hover:bg-blue-700
          transition
          disabled:opacity-60
        "
      >
        {isSubmitting
          ? "Guardando…"
          : isEditing
            ? "Guardar cambios"
            : "Crear proveedor"}
      </button>
    </form>
  );
}
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ClienteResponseDTO } from "../types";

/** Compat */
type ClienteResponseDTOCompat = ClienteResponseDTO & {
  phone?: string | null;
  phoneNumber?: string | null;
  sucursalId?: number | null;
  branchIds?: number[] | null;
};

const schema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || v === "" || z.string().email().safeParse(v).success,
      "Correo inválido"
    ),
branchIds: z.array(z.number().int().positive()).optional(),
});

export type ClienteFormValues = z.infer<typeof schema>;

type BranchLite = { id: number; name: string };

type Props = {
  initialData?: ClienteResponseDTO | null;
  onSubmit: (values: ClienteFormValues) => Promise<void> | void;
  isEditing?: boolean;

  showBranch?: boolean;

  branches?: BranchLite[];
  branchesLoading?: boolean;

  fixedBranchId?: number | null;
  fixedBranchName?: string;
};

export default function ClienteForm({
  initialData,
  onSubmit,
  isEditing,
  showBranch = false,
  branches = [],
  branchesLoading = false,
  fixedBranchName,
}: Props) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      branchIds: [],
    },
  });

  // ✅ typed number[]
  const selectedIds = useWatch({
    control,
    name: "branchIds",
    defaultValue: [],
  });

const safeSelectedIds = useMemo(
  () => selectedIds ?? [],
  [selectedIds]
);

  const toggleBranch = (bid: number) => {
  const set = new Set<number>(safeSelectedIds);
    if (set.has(bid)) {
      set.delete(bid);
    } else {
      set.add(bid);
    }
    const next = Array.from(set).sort((a, b) => a - b);

    setValue("branchIds", next, { shouldValidate: true, shouldDirty: true });

    if (next.length > 0) clearErrors("branchIds");
  };

  const selectedLabel = useMemo(() => {
    if (!showBranch) return "";
    if (safeSelectedIds.length === 0) return "Selecciona una o varias sucursales";
    if (safeSelectedIds.length === 1) {
      const b = branches.find((x) => x.id === safeSelectedIds[0]);
      return b?.name ?? `Sucursal #${safeSelectedIds[0]}`;
    }
    return `${safeSelectedIds.length} sucursales seleccionadas`;
  }, [showBranch, safeSelectedIds, branches]);

  useEffect(() => {
    if (!initialData) return;

    const data = initialData as ClienteResponseDTOCompat;
    const initialPhone = data.phone ?? data.phoneNumber ?? "";

    const initialBranchIds =
      Array.isArray(data.branchIds) && data.branchIds.length > 0
        ? data.branchIds
        : data.sucursalId
          ? [data.sucursalId]
          : [];

    reset({
      name: data.name ?? "",
      phone: initialPhone ?? "",
      email: data.email ?? "",
      branchIds: initialBranchIds,
    });
  }, [initialData, reset]);

const handleValidSubmit = async (values: ClienteFormValues) => {    const branchIds = values.branchIds ?? [];

    if (showBranch && branchIds.length === 0) {
      setError("branchIds", {
        type: "manual",
        message: "Selecciona al menos una sucursal",
      });
      return;
    }
  await onSubmit({
    ...values,
    branchIds,
  });
  };

  return (
    <form
      id="cliente-form"
      onSubmit={handleSubmit(handleValidSubmit)}
      className="grid gap-4 bg-white p-4 sm:p-6 rounded-xl border shadow-sm w-full"
    >
      {/* ✅ Sucursales multi-selección */}
      {showBranch ? (
        <div>
          <label className="block text-sm font-medium mb-1">Sucursales</label>
          <p className="text-xs text-slate-500 mb-2">{selectedLabel}</p>

          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="max-h-40 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
              {branchesLoading ? (
                <div className="p-3 text-sm text-slate-500">
                  Cargando sucursales…
                </div>
              ) : branches.length === 0 ? (
                <div className="p-3 text-sm text-slate-500">
                  No hay sucursales disponibles
                </div>
              ) : (
                branches.map((b) => {
                  const checked = safeSelectedIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBranch(b.id)}
                      className={[
                        "w-full text-left px-3 py-2 flex items-center gap-3 transition",
                        checked ? "bg-slate-200" : "bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        className="accent-blue-600 h-4 w-4"
                        checked={checked}
                        readOnly
                        tabIndex={-1}
                      />
                      <span className="text-sm text-slate-900 truncate">
                        {b.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {!!errors.branchIds?.message && (
            <p className="text-xs text-red-600 mt-2">{errors.branchIds.message}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Sucursal</label>
          <input
            className="w-full rounded-lg border px-3 py-2 bg-slate-100"
            value={fixedBranchName || "Sucursal asignada"}
            readOnly
          />
        </div>
      )}

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

      <div>
        <label className="block text-sm font-medium mb-1">Teléfono</label>
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
          {...register("phone")}
        />
      </div>

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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
      >
        {isSubmitting ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear cliente"}
      </button>
    </form>
  );
}

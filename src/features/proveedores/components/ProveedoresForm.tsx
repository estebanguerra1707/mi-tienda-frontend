import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Proveedor } from "../types";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Correo inválido").optional().nullable(),
  direccion: z.string().optional().nullable(),
  // 👇 sin coerce
  tipoNegocioId: z.number().int().min(1, "Selecciona un tipo de negocio"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  initialData?: Proveedor | null;
  onSubmit: (values: FormValues) => Promise<void> | void;
  isEditing?: boolean;
}

export default function ProveedorForm({ initialData, onSubmit, isEditing }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      telefono: "",
      email: "",
      direccion: "",
      tipoNegocioId: 0,
    },
  });

  useEffect(() => {
    if (!initialData) return;
    reset({
      nombre: initialData.name ?? "",
      telefono: initialData.contact ?? "",
      email: initialData.email ?? "",
      direccion: initialData.direccion ?? "",
      tipoNegocioId: initialData.tipoNegocioId ?? 0,
    });
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* ...los otros campos... */}
      <div>
        <label className="block text-sm mb-1">Tipo de negocio</label>
        <input
          type="number"
          className="border rounded px-3 py-2 w-full"
          {...register("tipoNegocioId", { valueAsNumber: true })}  // 👈 RHF castea a number
        />
        {errors.tipoNegocioId && <p className="text-red-600 text-xs">{errors.tipoNegocioId.message}</p>}
      </div>

      <button className="px-4 py-2 rounded bg-blue-600 text-white">
        {isEditing ? "Guardar cambios" : "Crear proveedor"}
      </button>
    </form>
  );
}

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCrearDevolucion } from "../hooks/useCrearDevolucion";
import type {
  CompraItem,
  DetalleCompraResponseDTO,
} from "@/features/compras/api";
import type { Devolucion } from "../types/Devolucion";
import { useDisableNumberWheel } from "@/hooks/useDisableNumberWheel";

const baseSchema = z.object({
  cantidad: z.number().min(1, "Debe ser mayor a 0"),
  motivo: z.string().min(3, "El motivo debe tener al menos 3 caracteres"),
});

type FormValues = z.infer<typeof baseSchema>;

const buildSchema = (max: number) =>
  baseSchema.extend({
    cantidad: baseSchema.shape.cantidad.max(
      max,
      `No puedes devolver más de ${max} unidades`
    ),
  });

interface Props {
  compra: CompraItem;
  detalle: DetalleCompraResponseDTO;
  onSuccess: (devolucion: Devolucion) => void;
}

export default function FormDevolucion({
  compra,
  detalle,
  onSuccess,
}: Props) {
   useDisableNumberWheel();
  const crearDevolucion = useCrearDevolucion();

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(detalle.quantity)),
    defaultValues: {
      cantidad: 1,
      motivo: "",
    },
  });

  const submit = async (data: FormValues) => {
    const payload = {
      compraId: compra.id,
      detalleId: detalle.id,
      branchId: detalle.branchId,
      codigoBarras: detalle.codigoBarras,
      sku: detalle.sku,
      cantidad: data.cantidad,
      motivo: data.motivo,
    };

    const response = await crearDevolucion.mutateAsync(payload);
    onSuccess(response);
  };

  const inputCls =
    "w-full border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition";

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="space-y-4"
    >
      {/* HEADER */}
      <div>
        <h3 className="text-base font-semibold">
          Registrar devolución
        </h3>
        <p className="text-sm text-gray-600">
          Producto: {detalle.productName}
        </p>
      </div>

      {/* CANTIDAD */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Cantidad a devolver
        </label>
        <input
          type="number"
          data-no-wheel="true"
          {...form.register("cantidad", { valueAsNumber: true })}
          className={inputCls}
        />
        {form.formState.errors.cantidad && (
          <p className="text-xs text-red-500">
            {form.formState.errors.cantidad.message}
          </p>
        )}
      </div>

      {/* MOTIVO */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Motivo
        </label>
        <textarea
          {...form.register("motivo")}
          rows={3}
          className={inputCls}
          placeholder="Describe el motivo"
        />
        {form.formState.errors.motivo && (
          <p className="text-xs text-red-500">
            {form.formState.errors.motivo.message}
          </p>
        )}
      </div>

      {/* BOTÓN */}
      <button
        type="submit"
        disabled={form.watch("cantidad") > detalle.quantity}
        className="
          w-full py-3 rounded-lg
          bg-blue-600 text-white
          hover:bg-blue-700
          transition
          disabled:opacity-50
        "
      >
        Registrar devolución
      </button>
    </form>
  );
}

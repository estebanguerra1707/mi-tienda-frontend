import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCrearDevolucion } from "../hooks/useCrearDevolucion";
import type {
  CompraItem,
  DetalleCompraResponseDTO,
} from "@/features/compras/api";
import type { Devolucion } from "../types/Devolucion";

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

export default function FormDevolucion({ compra, detalle, onSuccess }: Props) {
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
      sku:detalle.sku,
      cantidad: data.cantidad,
      motivo: data.motivo,
    };

    const response = await crearDevolucion.mutateAsync(payload);
    onSuccess(response);
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="card p-4">
      <h3 className="text-lg font-semibold mb-3">
        Registrar devolución para: {detalle.productName}
      </h3>

      <div className="flex flex-col gap-4">
        <input
          type="number"
          {...form.register("cantidad", { valueAsNumber: true })}
          className="input"
          placeholder="Cantidad a devolver"
        />

        <p className="text-red-500 text-sm">
          {form.formState.errors.cantidad?.message}
        </p>

        <textarea
          {...form.register("motivo")}
          className="input"
          placeholder="Motivo de la devolución"
        />

        <button
          className="btn-success"
          type="submit"
          disabled={form.watch("cantidad") > detalle.quantity}
        >
          Registrar devolución
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useDeleteVenta } from "@/hooks/useVentas";

interface Props {
  id: number;
  onDeleted: () => void;
}

export default function DeleteVentaButton({ id, onDeleted }: Props) {
  const [open, setOpen] = useState(false);
  const deleteVenta = useDeleteVenta();

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Evitamos comportamientos predeterminados de propagación del diálogo
    e.preventDefault();

    try {
      await deleteVenta.mutateAsync(id);
      setOpen(false); // Cerramos el modal primero
      onDeleted();    // Refrescamos la tabla / refetch
    } catch (err) {
      console.error("Error eliminando venta", err);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" title="Eliminar venta">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar venta</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Seguro que deseas eliminar esta venta? Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteVenta.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteVenta.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteVenta.isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
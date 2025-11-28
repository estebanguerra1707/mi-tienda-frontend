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

  const handleDelete = async () => {
    try {
      await deleteVenta.mutateAsync(id);
      onDeleted();
      setOpen(false);
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
          <AlertDialogCancel onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

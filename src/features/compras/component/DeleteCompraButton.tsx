import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDeleteCompra } from "@/hooks/useCompras";

export default function DeleteCompraButton({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted?: () => void;
}) {
  const { mutateAsync, isPending } = useDeleteCompra();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const confirmDelete = async () => {
    try {
      await mutateAsync(id);
      setToast({ type: "success", message: "Compra eliminada correctamente." });
      setOpen(false);
      onDeleted?.();
    } catch {
      setToast({ type: "error", message: "Error al eliminar compra." });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50"
      >
        Eliminar
      </button>

      <ConfirmDialog
        open={open}
        title="Eliminar compra"
        message="¿Seguro que deseas eliminar esta compra?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onClose={() => setOpen(false)}
        loading={isPending}
      />

      {toast &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[11000]">
            <div
              className={`px-3 py-2 rounded text-white shadow ${
                toast.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {toast.message}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

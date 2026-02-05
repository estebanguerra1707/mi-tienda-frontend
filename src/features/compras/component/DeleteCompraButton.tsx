import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDeleteCompra } from "@/hooks/useCompras";
import { Trash2 } from "lucide-react";

export default function DeleteCompraButton({
  id,
  onDeleted,
  idHtml, // ← NUEVO PROP
}: {
  id: number;
  onDeleted?: () => void;
  idHtml?: string; // ← NUEVO TIPO
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
        id={idHtml}
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        title="Eliminar"
        aria-label="Eliminar"
        className="
          inline-flex items-center justify-center
          px-2 py-1
          rounded
          bg-red-600 text-white
          hover:bg-red-700
          active:scale-[0.98]
          transition
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Trash2 className="h-4 w-4" />
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

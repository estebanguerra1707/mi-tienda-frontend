// src/features/productos/components/DeleteProductButton.tsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDeleteProduct } from "@/hooks/useProducts";
import { Trash2 } from "lucide-react";

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (data) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.error === "string") return data.error;
    }
    if (typeof e.message === "string") return e.message;
  }
  return "No se pudo eliminar el producto.";
}

export default function DeleteProductButton({
  id,
  name,
  onDeleted,
}: {
  id: number;
  name?: string;
  onDeleted?: () => void;
}) {
  const { mutateAsync, isPending } = useDeleteProduct();

  const [open, setOpen] = useState(false); // ← modal open
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const confirmDelete = async () => {
    try {
      type DeleteArg = Parameters<typeof mutateAsync>[0];
      const arg = (id as unknown) as DeleteArg; // ajusta si tu hook espera shape distinto
      await mutateAsync(arg);
      setToast({ type: "success", message: "Producto eliminado." });
      setOpen(false);
      onDeleted?.();
    } catch (err) {
      setToast({ type: "error", message: getErrorMessage(err) });
      setOpen(false);
    }
  };

  return (
    <>
    <button
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
      {isPending ? (
        <span className="h-4 w-4 rounded-full border-2 border-red-300 border-t-red-700 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>

     <ConfirmDialog
      open={open}
      title="Eliminar producto"
      message={`Esta acción desactivará el producto${name ? ` “${name}”` : ""}. ¿Deseas continuar?`}
      confirmText="Eliminar"
      cancelText="Cancelar"
      loading={isPending}
      onOpenChange={setOpen}
      onCancel={() => setOpen(false)}
      onClose={() => setOpen(false)} 
      onConfirm={confirmDelete}
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

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteCategoria } from "@/features/categorias/categorias.api";

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;

  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof e.message === "string") return e.message;
  }
  return "No se pudo eliminar la categoría.";
}

export default function DeleteCategoriaButton({
  id,
  name,
  onDeleted,
}: {
  id: number;
  name?: string;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteCategoria(id);
      setToast({ type: "success", message: "Categoría eliminada." });
      setOpen(false);
      onDeleted?.();
    } catch (err) {
      setToast({ type: "error", message: getErrorMessage(err) });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
        title="Eliminar"
      >
        {loading ? "Eliminando…" : "Eliminar"}
      </button>

      <ConfirmDialog
        open={open}
        title="Eliminar categoría"
        message={`Esta acción desactivará la categoría${name ? ` “${name}”` : ""}. ¿Deseas continuar?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={loading}
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

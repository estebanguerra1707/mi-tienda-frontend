import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDeleteProveedor } from "../useProveedores";
import { Trash2 } from "lucide-react";

type Props = {
  id: number;
  name?: string;
  onDeleted?: () => void | Promise<void>;
};

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; response?: { data?: unknown } };
    const data = e.response?.data as { message?: unknown; error?: unknown } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    if (typeof e.message === "string") return e.message;
  }
  return "No se pudo eliminar el proveedor.";
}

export default function DeleteProveedorButton({ id, name }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] =
    useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

const delMutation = useDeleteProveedor();

const confirmDelete = async () => {
  try {
    setLoading(true);
    await delMutation.mutateAsync(id);

    setToast({ type: "success", message: "Proveedor eliminado." });
    setOpen(false);
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
        title="Eliminar"
        aria-label="Eliminar"
        className="
          inline-flex items-center justify-center
          h-10 w-10
          rounded-xl
          bg-red-600 text-white
          hover:bg-red-700
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition
        "
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={open}
        title="Eliminar proveedor"
        message={`Esta acción desactivará el proveedor${name ? ` “${name}”` : ""}. ¿Deseas continuar?`}
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

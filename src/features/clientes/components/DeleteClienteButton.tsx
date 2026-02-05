import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDisableCliente } from "../useClients";
import { Trash2 } from "lucide-react";

type Props = {
  id: number;
  name?: string;
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

  return "No se pudo eliminar el cliente.";
}

export default function DeleteClienteButton({ id, name }: Props) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const delMutation = useDisableCliente();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const confirmDelete = async () => {
    try {
      await delMutation.mutateAsync(id);
      setToast({ type: "success", message: "Cliente eliminado." });
      setOpen(false);
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
        disabled={delMutation.isPending}
        title="Eliminar"
        aria-label="Eliminar"
        className="
          inline-flex items-center justify-center
          px-2 py-1
          rounded
          bg-red-600 text-white
          hover:bg-red-700
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition
        "
      >
        {delMutation.isPending ? (
          <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      <ConfirmDialog
        open={open}
        title="Eliminar cliente"
        message={`Esta acción desactivará el cliente${name ? ` “${name}”` : ""}. ¿Deseas continuar?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={delMutation.isPending}
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

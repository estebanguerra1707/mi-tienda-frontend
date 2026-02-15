import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProveedorForm, { ProveedorFormValues } from "./ProveedoresForm";
import { useCreateProveedor } from "@/hooks/useProveedores";
import type { CreateProveedorDto } from "../types";

function getBackendMessage(err: unknown): string | null {
  // err.response.data.message (Axios style)
  if (typeof err === "object" && err !== null) {
    const maybe = err as { response?: { data?: unknown } };
    const data = maybe.response?.data;

    if (typeof data === "object" && data !== null) {
      const d = data as { message?: unknown };
      if (typeof d.message === "string" && d.message.trim() !== "") {
        return d.message;
      }
    }
  }
  return null;
}

export default function ProveedorCreatePage() {
  const navigate = useNavigate();
  const create = useCreateProveedor();

  const handleSubmit = async (values: ProveedorFormValues) => {
    if (!values.branchIds || values.branchIds.length === 0) {
      toast.error("Debes seleccionar al menos una sucursal.");
      return;
    }

    const payload: CreateProveedorDto = {
      name: values.name,
      contact: values.contact ?? null,
      email: values.email ?? null,
      branchIds: values.branchIds,
    };

    try {
      await create.mutateAsync(payload);
      toast.success("Proveedor creado correctamente");
      navigate("/proveedores");
    } catch (err) {
      const backendMsg = getBackendMessage(err);
      const fallback = err instanceof Error ? err.message : "No se pudo crear el proveedor";
      toast.error(backendMsg ?? fallback);
    }
  };

  return (
    <div
      className="
        min-h-screen
        bg-slate-50
        pb-[calc(env(safe-area-inset-bottom)+96px)]
        sm:pb-6
      "
    >
      {/* ===== Header móvil (sticky, estilo app) ===== */}
      <div className="sm:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 text-lg font-semibold"
            aria-label="Volver"
          >
            ←
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">Nuevo proveedor</h1>
            <p className="text-xs text-slate-500">Agrega un proveedor a tu sucursal</p>
          </div>
        </div>
      </div>

      {/* ===== Contenido ===== */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
          <div className="hidden sm:block mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Nuevo proveedor</h1>
            <p className="text-sm text-slate-600 mt-1">
              Completa la información del proveedor
            </p>
          </div>

          <ProveedorForm onSubmit={handleSubmit} />
        </div>
      </div>

      {/* ===== Sticky footer (MÓVIL) ===== */}
      <div
        className="
          sm:hidden
          fixed bottom-0 inset-x-0
          bg-white/95 backdrop-blur
          border-t
          px-4 py-3
          flex gap-3
          z-40
        "
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            flex-1 h-11
            rounded-xl
            border
            text-slate-700
            font-semibold
            active:scale-[0.99]
            transition
          "
        >
          Cancelar
        </button>

        <button
          type="submit"
          form="proveedor-form"
          disabled={create.isPending}
          className="
            flex-1 h-11
            rounded-xl
            bg-blue-600
            text-white
            font-semibold
            shadow
            hover:bg-blue-700
            active:scale-[0.99]
            transition
            disabled:opacity-60
          "
        >
          {create.isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

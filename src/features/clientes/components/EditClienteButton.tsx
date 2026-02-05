import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import ClienteForm, { ClienteFormValues } from "./ClienteForm";
import { useCliente, useUpdateCliente } from "../useClients";
import type { ClienteDTO } from "../types";
import { useBranches } from "@/hooks/useCatalogs";
import { useAuth } from "@/hooks/useAuth";
import { Pencil } from "lucide-react";
type Role = "ADMIN" | "VENDOR" | "SUPER_ADMIN";

type Props = {
  id: number;
};

export default function EditClienteButton({ id }: Props) {
  const [open, setOpen] = useState(false);

  const { data: cliente, isFetching } = useCliente(open ? id : undefined);

  const updateMutation = useUpdateCliente();

  const dialogTitleId = useMemo(() => `edit-cliente-title-${id}`, [id]);
  const dialogDescId = useMemo(() => `edit-cliente-desc-${id}`, [id]);
  

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const onClose = () => {
    if (updateMutation.isPending) return;
    setOpen(false);
  };
const auth = useAuth() as {
  user?: { role?: Role; branchId?: number | null; businessType?: number | null };
  hasRole?: (r: Role) => boolean;
};
const role = auth.user?.role;
const isSuper = role === "SUPER_ADMIN";

const { data: branches = [], isLoading: branchesLoading } = useBranches({
  isSuper,
  businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
  oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
});

const fixedBranchName = useMemo(() => {
  if (isSuper) return undefined;
  if (!auth.user?.branchId) return "Sucursal asignada";

  return (
    branches.find(b => b.id === auth.user?.branchId)?.name
    ?? "Sucursal asignada"
  );
}, [isSuper, branches, auth.user?.branchId]);


  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, updateMutation.isPending]);

  const onSubmit = async (values: ClienteFormValues) => {
    const payload: ClienteDTO = {
      name: values.name.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : null,
      email: values.email?.trim() ? values.email.trim() : null,
      branchIds: isSuper
        ? values.branchIds ?? []
        : auth.user?.branchId
          ? [auth.user.branchId]
          : [],
    };

    await updateMutation.mutateAsync({ id, payload });
    toast.success("Cliente actualizado correctamente");
    setOpen(false);
  };

  return (
    <>
     <button
      type="button"
      onClick={() => setOpen(true)}
      title="Editar"
      aria-label="Editar"
      className="
        inline-flex items-center justify-center
        px-2 py-1
        rounded
        bg-slate-200 text-slate-900
        hover:bg-slate-200
        active:scale-[0.98]
        transition
      "
    >
      <Pencil className="h-4 w-4" />
    </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000]">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={onClose}
            />

            {/* Mobile: bottom-sheet | Desktop: centered */}
            <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center p-0 sm:p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                aria-describedby={dialogDescId}
                className="
                  w-full sm:w-[min(100vw-2rem,42rem)]
                  bg-white shadow-2xl border border-black/5
                  rounded-t-3xl sm:rounded-3xl
                  overflow-hidden
                  max-h-[92dvh] sm:max-h-[90dvh]
                  transform-gpu
                  animate-[sheetIn_.18s_ease-out]
                "
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-5 pt-4 pb-3 border-b flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {/* Handle mobile */}
                    <div className="sm:hidden mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                    <h2 id={dialogTitleId} className="text-base sm:text-lg font-semibold truncate">
                      Editar cliente
                    </h2>
                    <p id={dialogDescId} className="text-sm text-slate-500">
                      {isFetching ? "Cargando…" : "Actualiza los datos del cliente"}
                    </p>
                  </div>

                  <button
                    ref={closeBtnRef}
                    type="button"
                    className="
                      h-10 w-10 shrink-0
                      rounded-xl
                      hover:bg-slate-100 active:bg-slate-200
                      transition
                      grid place-items-center
                      disabled:opacity-50
                    "
                    onClick={onClose}
                    disabled={updateMutation.isPending}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>

                {/* Body scroll interno iOS/Android */}
                <div
                  className="
                    px-4 sm:px-6 py-4
                    overflow-y-auto overscroll-contain
                    [scrollbar-gutter:stable]
                    max-h-[calc(92dvh-72px)]
                    sm:max-h-[calc(90dvh-72px)]
                    pb-[calc(env(safe-area-inset-bottom)+16px)]
                  "
                >
               <ClienteForm
                  initialData={cliente ?? null}
                  onSubmit={onSubmit}
                  isEditing
                  showBranch={isSuper}
                  branches={branches}
                  branchesLoading={branchesLoading}
                  fixedBranchId={!isSuper ? auth.user?.branchId ?? null : null}
                  fixedBranchName={fixedBranchName}
                />

                  {updateMutation.isPending && (
                    <p className="mt-3 text-sm text-slate-500">Guardando…</p>
                  )}
                </div>
              </div>
            </div>

            {/* Keyframes inline (no necesitas tocar Tailwind config) */}
            <style>{`
              @keyframes sheetIn {
                from { opacity: 0; transform: translate3d(0, 18px, 0) scale(.99); }
                to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
              }
              @media (prefers-reduced-motion: reduce) {
                .animate-[sheetIn_.18s_ease-out] { animation: none !important; }
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  );
}
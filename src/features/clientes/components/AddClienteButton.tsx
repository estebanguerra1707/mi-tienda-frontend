import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import ClienteForm, { ClienteFormValues } from "./ClienteForm";
import { useCreateCliente } from "../useClients";
import type { CreateClienteDto } from "../types";

import { useAuth } from "@/hooks/useAuth";
import { useBranches } from "@/hooks/useCatalogs";

type Role = "ADMIN" | "VENDOR" | "SUPER_ADMIN";

export default function AddClienteButton() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateCliente();

  const auth = useAuth() as {
    user?: { role?: Role; branchId?: number | null; businessType?: number | null };
    hasRole?: (r: Role) => boolean;
  };

const role = auth.user?.role;

const isSuper = role === "SUPER_ADMIN";
const isAdmin = role === "ADMIN";


const { data: branches = [], isLoading: branchesLoading } = useBranches({
  isSuper,
  businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
  oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
});

  const [branchName, setBranchName] = useState("");

  const dialogTitleId = useMemo(() => "add-cliente-title", []);
  const dialogDescId = useMemo(() => "add-cliente-desc", []);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const onClose = () => {
    if (createMutation.isPending) return;
    setOpen(false);
  };
  useEffect(() => {
  if (!open) return;

  if (!isSuper) {
    const bid = auth.user?.branchId;
    if (!bid) return;

    const b = branches.find(x => x.id === bid);
    setBranchName(b?.name ?? "Sucursal asignada");
  }
}, [open, isSuper, branches, auth.user?.branchId]);


        useEffect(() => {
        if (!open) return;
        if (isSuper) return;

        const bid = auth.user?.branchId ?? null;
        if (!bid) return;

        const b = branches.find((x) => x.id === bid);
        setBranchName(b?.name ?? "Sucursal asignada");
        }, [open, isSuper, branches, auth.user?.branchId]);

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
  }, [open, createMutation.isPending]);

    const onSubmit = async (values: ClienteFormValues) => {

    let branchIds: number[] | undefined;

    if (isSuper) {
        if (!values.branchIds || values.branchIds.length === 0) {
        toast.error("Selecciona al menos una sucursal");
        return;
        }
        branchIds = values.branchIds;
    } else if (isAdmin) {
        if (!auth.user?.branchId) {
        toast.error("Sucursal no determinada");
        return;
        }
        branchIds = [auth.user.branchId];
    }

    const payload: CreateClienteDto = {
        name: values.name.trim(),
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
        ...(branchIds ? { branchIds } : {}),
    };

    await createMutation.mutateAsync(payload);
    toast.success("Cliente creado correctamente");
    setOpen(false);
    };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          inline-flex items-center justify-center gap-2
          rounded-xl bg-blue-600 text-white font-semibold
          px-4 py-2
          hover:bg-blue-700 active:scale-[0.99]
          transition
          w-full sm:w-auto
        "
      >
        + Nuevo cliente
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[10000]">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={onClose}
            />

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
                <div className="px-5 pt-4 pb-3 border-b flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="sm:hidden mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
                    <h2 id={dialogTitleId} className="text-base sm:text-lg font-semibold truncate">
                      Nuevo cliente
                    </h2>
                    <p id={dialogDescId} className="text-sm text-slate-500">
                      Completa los datos del cliente
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
                    disabled={createMutation.isPending}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>

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
                    key={open ? "open" : "closed"}
                    onSubmit={onSubmit}
                    showBranch={isSuper}
                    branches={branches}
                    branchesLoading={branchesLoading}
                    fixedBranchId={!isSuper ? auth.user?.branchId ?? null : null}
                    fixedBranchName={!isSuper ? branchName : undefined}
                    />

                  {createMutation.isPending && (
                    <p className="mt-3 text-sm text-slate-500">Guardando…</p>
                  )}
                </div>
              </div>
            </div>

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
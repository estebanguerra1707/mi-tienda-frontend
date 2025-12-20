import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmLogoutModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="
        absolute inset-x-0 bottom-0 sm:inset-0
        flex items-end sm:items-center justify-center
        p-4
      ">
        <div className="
          w-full max-w-sm
          rounded-3xl bg-white
          shadow-xl
          overflow-hidden
        ">
          <div className="p-5 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              ¿Cerrar sesión?
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Tendrás que iniciar sesión nuevamente.
            </p>
          </div>

          <div className="flex border-t">
            <button
              onClick={onCancel}
              className="
                flex-1 h-12
                text-slate-700 font-medium
                hover:bg-slate-100
              "
            >
              Cancelar
            </button>

            <button
              onClick={onConfirm}
              className="
                flex-1 h-12
                text-red-600 font-semibold
                hover:bg-red-50
              "
            >
              Cerrar sesión
            </button>
          </div>

          {/* Safe-area iPhone */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>,
    document.body
  );
}

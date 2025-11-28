// components/ResponsiveModal.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ResponsiveModal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  // siempre llamar hooks, condiciona por `open`
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (open) {
      html.classList.add("overflow-hidden");
      body.classList.add("overflow-hidden");
      return () => {
        html.classList.remove("overflow-hidden");
        body.classList.remove("overflow-hidden");
      };
    }
    html.classList.remove("overflow-hidden");
    body.classList.remove("overflow-hidden");
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] isolate" // <-- isolate = nuevo stacking context top-level
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel: sheet en móvil y centrado en sm+ */}
      <div
        className="
          fixed left-0 right-0 bottom-0 z-[10001] 
          w-full rounded-t-2xl bg-white shadow-2xl
          sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto
          sm:w-auto sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl
          overflow-hidden
        "
      >
        <header className="sticky top-0 z-[10002] flex items-center justify-between gap-3 border-b bg-white p-4">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="rounded border px-2 py-1 text-sm hover:bg-slate-100 transition"
          >
            Cerrar
          </button>
        </header>

        <div className="max-h-[75vh] overflow-y-auto p-4 sm:max-h-[70vh]">
          {children}
        </div>

        {footer && (
          <footer className="sticky bottom-0 z-[10002] border-t bg-white p-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}

// src/components/ConfirmDialog.tsx
import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  /** Texto principal a resaltar (p.ej. nombre del producto) */
  subject?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title = "Confirmar",
  message = "¿Estás seguro?",
  subject,
  confirmText = "Sí, confirmar",
  cancelText = "Cancelar",
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-[min(100vw-2rem,40rem)] rounded-2xl bg-white p-6 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            {/* ícono simple */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>
            <p className="mt-2 text-slate-600 break-words">{message}</p>

            {subject && (
              <div
                className="mt-3 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-800
                           max-h-28 overflow-auto break-words hyphens-auto"
                title={subject}
              >
                {subject}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Eliminando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

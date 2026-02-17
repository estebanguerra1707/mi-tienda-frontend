import { useLayoutEffect, useRef } from "react";

type DecimalCaretOptions = {
  maxDecimals?: number; // por default 2
};

/**
 * Mantiene el caret en una posición correcta aunque sanitices el value.
 * Úsalo en inputs controlados donde modificas el valor en onChange.
 */
export function useDecimalCaretInput(options: DecimalCaretOptions = {}) {
  const { maxDecimals = 2 } = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextSelection = useRef<{ start: number; end: number } | null>(null);

  const sanitizeDecimal = (raw: string) => {
    // deja solo dígitos, punto y coma
    let v = raw.replace(/[^\d.,]/g, "");

    // normaliza coma -> punto y deja solo 1 punto
    v = v.replace(",", ".");
    const firstDot = v.indexOf(".");
    if (firstDot !== -1) {
      const before = v.slice(0, firstDot + 1);
      const after = v
        .slice(firstDot + 1)
        .replace(/\./g, "") // quita puntos extra
        .slice(0, maxDecimals); // limita decimales
      v = before + after;
    }

    // permite ".2" mientras escribes
    return v;
  };

  const onChangeWithCaret = (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: (next: string) => void
  ) => {
    const el = e.currentTarget;

    const prev = el.value;
    const prevPos = el.selectionStart ?? prev.length;

    const next = sanitizeDecimal(prev);

    // diferencia de longitud para ajustar caret
    const delta = next.length - prev.length;
    const nextPos = Math.max(0, Math.min(next.length, prevPos + delta));

    nextSelection.current = { start: nextPos, end: nextPos };

    setValue(next);
  };

  useLayoutEffect(() => {
    const el = inputRef.current;
    const sel = nextSelection.current;
    if (!el || !sel) return;

    // espera al repaint del value controlado
    requestAnimationFrame(() => {
      try {
        el.setSelectionRange(sel.start, sel.end);
      } catch {
        // algunos navegadores pueden fallar si no está focus
      }
    });

    nextSelection.current = null;
  });

  return { inputRef, onChangeWithCaret };
}

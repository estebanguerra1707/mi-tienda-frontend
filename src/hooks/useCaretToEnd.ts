import { useLayoutEffect, useRef, useState } from "react";

export function useCaretToEnd(value: string) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);

  useLayoutEffect(() => {
    if (!focused) return;
    const el = ref.current;
    if (!el) return;

    const pos = value.length;
    try {
      el.setSelectionRange(pos, pos);
    } catch (err) {
      // Algunos navegadores (o inputs) no soportan setSelectionRange.
      void err;
    }
  }, [value, focused]);

  return {
    ref,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
}

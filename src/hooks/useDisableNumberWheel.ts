// useDisableNumberWheel.ts
import { useEffect } from "react";

export function useDisableNumberWheel() {
  useEffect(() => {
    const onWheel: EventListener = (event) => {
      // En eventos de wheel del browser, sí es WheelEvent
      const e = event as WheelEvent;

      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;

      if (el.dataset.noWheel === "true" && document.activeElement === el) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, []);
}

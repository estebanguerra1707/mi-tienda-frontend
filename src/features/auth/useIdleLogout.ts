import { useEffect, useRef } from "react";
import { logout } from "@/features/auth/authService";

const IDLE_LIMIT = 60 * 60 * 1000; // inactividad 1h

export function useIdleLogout() {
  const timer = useRef<number | null>(null);

  // Reinicia el temporizador
  const resetTimer = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      console.warn("⏳ Sesión cerrada por inactividad");
      logout(); 
    }, IDLE_LIMIT);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((e) => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetTimer)
      );
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);
}

import { useEffect, useRef } from "react";
import { logout } from "@/features/auth/authService";

const IDLE_LIMIT = 5 * 60 * 1000; // 5 minutos en milisegundos

export function useIdleLogout() {
  const timer = useRef<number | null>(null);

  // Reinicia el temporizador
  const resetTimer = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }

    timer.current = window.setTimeout(() => {
      console.warn("⏳ Sesión cerrada por inactividad");
      logout(); // limpia tokens + redirige al login
    }, IDLE_LIMIT);
  };

  useEffect(() => {
    // Eventos que reinician el temporizador
    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((e) => window.addEventListener(e, resetTimer));

    resetTimer(); // al cargar la app

    return () => {
      events.forEach((e) =>
        window.removeEventListener(e, resetTimer)
      );
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);
}

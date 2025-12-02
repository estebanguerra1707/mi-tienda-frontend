import { useEffect } from "react";
import { logout } from "../auth/authService";

const INACTIVITY_MINUTES = 30;

export function useInactivityLogout() {
  useEffect(() => {
    let timer: number;

    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        logout();
      }, INACTIVITY_MINUTES * 60 * 1000);
    };

    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);

    reset();

    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("click", reset);
      window.clearTimeout(timer);
    };
  }, []);
}

import { useEffect } from "react";
import { connectQZAutomatically } from "@/lib/qzAutoConnect";
import { useInactivityLogout } from "./features/auth/useInactivityLogout";
import { ping } from "@/lib/ping";

export default function App() {
  useInactivityLogout();

  useEffect(() => {
    connectQZAutomatically();
  }, []);

  return <div className="p-6">Alias funcionando: {ping}</div>;
}

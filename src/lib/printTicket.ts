import { toastError } from "@/lib/toast";
import { API_BASE_URL } from "@/lib/api";
type TicketType = "venta" | "compra";

export async function printTicketUniversal(id: number, type: TicketType) {
  if (!id) {
    toastError("ID inválido");
    return;
  }

const url = `${API_BASE_URL}/pdf-sender/${type}/${id}?isPrinted=true`;

  // 1) QZ-Tray (PC con impresora térmica real)
  if (window.qz) {
    try {
      window.open(url, "_blank");
      return;
    } catch {
      console.warn("QZ error, usando fallback.");
    }
  }

  // 2) Android (RAWBT)
  if (/Android/i.test(navigator.userAgent)) {
    window.open(url, "_blank");
    return;
  }

  // 3) PC / iPhone / Tablet → impresión nativa
  window.open(url, "_blank");
}
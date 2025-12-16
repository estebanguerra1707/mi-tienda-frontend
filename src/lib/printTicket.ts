import { toastError } from "@/lib/toast";
import { toastSuccess } from "@/lib/toastSuccess";
import { API_BASE_URL } from "@/lib/api";
import { printTicketRaw } from "@/lib/printTicketRaw";

type TicketType = "venta" | "compra";

export async function printTicketUniversal(id: number, type: TicketType) {
  if (!id) {
    toastError("ID inválido");
    return;
  }

  const qz = window.qz;

  try {
    if (qz && qz.websocket) {
      if (!qz.websocket.isActive()) {
        toastSuccess("Conectando impresora...");
        console.log("🟠 QZ inactivo → conectando...");

        await qz.websocket.connect();

        toastSuccess("Impresora lista ✔");
        console.log("🟢 QZ conectado correctamente");
      }
    }

    if (qz && qz.websocket && qz.websocket.isActive()) {
      console.log("🖨 Imprimiendo ticket térmico RAW...");

      await printTicketRaw(id, type);

      toastSuccess("Ticket enviado a impresión 🧾");
      return;
    }

  } catch (err) {
    console.error("⚠ Error con QZ:", err);
    toastError("No se pudo imprimir. Abriendo PDF...");
  }

  const pdfUrl = `${API_BASE_URL}/pdf-sender/${type}/${id}?isPrinted=true`;
  window.open(pdfUrl, "_blank");
}

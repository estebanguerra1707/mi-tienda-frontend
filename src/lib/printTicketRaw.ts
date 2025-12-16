import { API_BASE_URL } from "@/lib/api";
import { toastError } from "@/lib/toast";

export async function printTicketRaw(id: number, type: "venta" | "compra") {
  try {
    if (!window.qz) {
      toastError("QZ-Tray no está instalado o no se detectó.");
      return;
    }

    if (!window.qz.websocket.isActive()) {
      await window.qz.websocket.connect();
    }

    // Obtener ticket RAW
    const res = await fetch(`${API_BASE_URL}/ticket-raw/${type}/${id}`);

    if (!res.ok) {
      toastError("No se pudo obtener el ticket RAW");
      return;
    }

    const rawText = await res.text();

    const printer = await window.qz.printers.getDefault();

    if (!printer) {
      toastError("No se encontró una impresora para imprimir.");
      return;
    }

    const config = window.qz.configs.create(printer);

    await window.qz.print(config, [
      {
        type: "raw",
        format: "plain",
        data: rawText + "\n\n\n",
      },
    ]);
  } catch (err) {
    console.error("❌ Error imprimiendo ticket RAW:", err);
    toastError("Error imprimiendo en impresora térmica.");
  }
}

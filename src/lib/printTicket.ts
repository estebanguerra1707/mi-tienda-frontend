import { toastError } from "@/lib/toast";
import { toastSuccess } from "@/lib/toastSuccess";
import { API_BASE_URL } from "@/lib/api";
import { printTicketRaw } from "@/lib/printTicketRaw";

type TicketType = "venta" | "compra" | "venta-consolidada";

const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken")
  );
};

async function openPdfWithAuth(pdfUrl: string) {
  const token = getAuthToken();

  if (!token) {
    toastError("No se encontró sesión activa para abrir el ticket.");
    return;
  }

  /**
   * Abrimos una pestaña vacía primero para evitar que Chrome bloquee
   * el popup después del await fetch.
   */
  const newWindow = window.open("", "_blank");

  if (!newWindow) {
    toastError("El navegador bloqueó la ventana del ticket.");
    return;
  }

  try {
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    });

    if (response.status === 401 || response.status === 403) {
      newWindow.close();
      toastError("No tienes autorización para abrir este ticket.");
      return;
    }

    if (!response.ok) {
      newWindow.close();
      toastError("No se pudo generar el ticket consolidado.");
      return;
    }

    const blob = await response.blob();

    const fileUrl = window.URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" })
    );

    newWindow.location.href = fileUrl;

    setTimeout(() => {
      window.URL.revokeObjectURL(fileUrl);
    }, 60_000);
  } catch (error) {
    newWindow.close();
    console.error("Error abriendo PDF con autorización:", error);
    toastError("Ocurrió un error al abrir el ticket consolidado.");
  }
}

export async function printTicketUniversal(
  id: number | string,
  type: TicketType
) {
  if (!id) {
    toastError("ID inválido");
    return;
  }

  const qz = window.qz;

  const pdfUrl =
    type === "venta-consolidada"
      ? `${API_BASE_URL}/ventas/consolidado/${id}/ticket`
      : `${API_BASE_URL}/pdf-sender/${type}/${id}?isPrinted=true`;

  /**
   * Venta consolidada:
   * No usa QZ todavía.
   * No se abre directo con window.open(pdfUrl), porque /ventas/** está protegido.
   * Se pide con fetch + Authorization y luego se abre como blob.
   */
  if (type === "venta-consolidada") {
    await openPdfWithAuth(pdfUrl);
    return;
  }

  try {
    /**
     * Por ahora el RAW solo lo usamos para venta/compra normal.
     */
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

      await printTicketRaw(Number(id), type);

      toastSuccess("Ticket enviado a impresión 🧾");
      return;
    }
  } catch (err) {
    console.error("⚠ Error con QZ:", err);
    toastError("No se pudo imprimir. Abriendo PDF...");
  }

  window.open(pdfUrl, "_blank");
}
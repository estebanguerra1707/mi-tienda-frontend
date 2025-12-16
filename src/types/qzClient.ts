import { API_BASE_URL } from "@/lib/api";

export async function initQZ() {
  const qz = window.qz;

  if (!qz) {
    throw new Error("QZ-Tray no está instalado o no se detectó.");
  }

  // 🛑 NO volver a conectar si ya está activo
  if (qz.websocket.isActive()) {
    console.log("⚡ QZ ya estaba conectado.");
    return;
  }

  // Certificado local
  qz.security.setCertificatePromise(() =>
    fetch("/cert/app-cert.pem").then((res) => res.text())
  );

  // Firma con tu backend
  qz.security.setSignaturePromise(async (toSign: string) => {
    const res = await fetch(`${API_BASE_URL}/qz/sign`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: toSign,
    });

    if (!res.ok) {
      throw new Error("Error al firmar con el servidor.");
    }

    return await res.text();
  });

  // Conectar SOLO si estaba desconectado
  await qz.websocket.connect();

  console.log("🔥 Conectado a QZ correctamente");
}

export async function printViaQZ(pdfUrl: string) {
  const qz = window.qz;
  if (!qz) throw new Error("QZ no detectado.");

  // 🔧 Garantizar que QZ esté conectado
  await initQZ();

  // Tomar impresora predeterminada
  const printer = await qz.printers.getDefault();

  if (!printer) {
    throw new Error("No se encontró una impresora predeterminada.");
  }

  console.log("🖨️ Imprimiendo en:", printer);

  const config = qz.configs.create(printer, {
    scaleContent: "fit",
    rasterize: true,
  });

  const data = [
    {
      type: "pdf",
      format: "base64",
      data: await loadPdfAsBase64(pdfUrl),
    },
  ];

  await qz.print(config, data);

  console.log("✅ Ticket enviado a impresión");
}

// Convertir PDF a base64 para QZ
async function loadPdfAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// lib/qzAutoConnect.ts
export async function connectQZAutomatically() {
  if (!window.qz) {
    console.warn("QZ no está cargado aún.");
    return;
  }

  // Si ya está conectado, no reconectar
  if (window.qz.websocket.isActive()) {
    console.log("QZ ya estaba conectado.");
    return;
  }

  try {
    console.log("Intentando conectar QZ...");

    // Certificado
    window.qz.security.setCertificatePromise(() =>
      fetch("/cert/app-cert.pem").then(res => res.text())
    );

    // Firma digital
    window.qz.security.setSignaturePromise(() =>
      Promise.resolve("") // Para pruebas, después ponemos el servidor
    );

    await window.qz.websocket.connect();
    console.log("QZ conectado automáticamente.");
  } catch (err) {
    console.error("Error conectando QZ:", err);
  }
}

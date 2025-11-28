import "@/types/qz"; // asegura que TS vea window.qz

// Cliente QZ para impresión térmica

export async function initQZ() {
  if (!window.qz) {
    throw new Error("QZ-Tray no está instalado o no se detectó.");
  }

  // Saltar validaciones SSL (solo local)
  window.qz.security.setCertificatePromise(() =>
    Promise.resolve("-----BEGIN CERTIFICATE-----\nMIIF...\n-----END CERTIFICATE-----")
  );

  // Saltar firma digital (opcional en desarrollo)
  window.qz.security.setSignaturePromise(() =>
    Promise.resolve("")
  );

  await window.qz.websocket.connect();
}

export async function printViaQZ(pdfUrl: string) {
  await initQZ();

  const printer = await window.qz!.printers.getDefault();

  if (!printer) {
    throw new Error("No se encontró una impresora predeterminada.");
  }

  const config = window.qz!.configs.create(printer, {
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

  await window.qz!.print(config, data);

  // desconectar después
  await window.qz!.websocket.disconnect();
}

// 👇 Esta función faltaba, por eso el error "Cannot find name 'loadPdfAsBase64'"
async function loadPdfAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // "data:application/pdf;base64,AAA..." -> nos quedamos con lo de después de la coma
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// src/types/qz.d.ts

declare global {
  interface Window {
    qz?: QZTray;
  }
}

interface QZTray {
  websocket: {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  };

  security: {
    setCertificatePromise(fn: () => Promise<string>): void;
    setSignaturePromise(fn: (toSign: string) => Promise<string>): void;
  };

  printers: {
    getDefault(): Promise<string>;
    find(): Promise<string[]>;
  };

  configs: {
    create(printer: string, options?: Record<string, unknown>): unknown;
  };

  print(config: unknown, data: unknown[]): Promise<void>;
}

export {};

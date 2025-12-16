export interface QZTray {
  websocket: {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
  };

  security: {
    setCertificatePromise(fn: () => Promise<string>): void;
    setSignaturePromise(fn: () => Promise<string>): void;
  };

  printers: {
    getDefault(): Promise<string>;
    find(): Promise<string[]>;
  };

  configs: {
    create(
      printer: string,
      options?: Record<string, unknown>
    ): unknown;
  };

  print(config: unknown, data: unknown[]): Promise<void>;
}

export {};

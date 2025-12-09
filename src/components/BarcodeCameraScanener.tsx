import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo
} from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException
} from "@zxing/library";

interface Props {
  onResult: (code: string) => void;
  onError?: (err: string) => void;
}

interface ExtendedCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  exposureMode?: string[];
  zoom?: { min: number; max: number; step: number };
}

type SafeAdvancedConstraint = MediaTrackConstraintSet & {
  focusMode?: string;
  exposureMode?: string;
  zoom?: number;
};

type SafeConstraints = {
  advanced: SafeAdvancedConstraint[];
};

export default function BarcodeCameraScanner({ onResult, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef(false);
  const startCameraRef = useRef<() => void>(() => {});
  const failCountRef = useRef(0);

  /** FIX REAL → evitar warning de React sin romper nada */
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [detected, setDetected] = useState<string | null>(null);
  const [focusing, setFocusing] = useState(true);

  /** Detectar laptop */
  const isLaptop = useMemo(() => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    return /Mac|Win|Linux/i.test(platform) && !/Android|iPhone|iPad/i.test(ua);
  }, []);

  /** Hints ZXing */
  const hints = useMemo(() => {
    const h = new Map();
    h.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39
    ]);
    h.set(DecodeHintType.TRY_HARDER, true);
    return h;
  }, []);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader(hints);
    return () => {
      readerRef.current = null;
    };
  }, [hints]);

  /** Anti duplicado */
  const lastScan = useRef(0);
  const notifyScan = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastScan.current < 1200) return;
    lastScan.current = now;

    setDetected(text);
    new Audio("/beep.mp3").play().catch(() => {});
    navigator.vibrate?.(150);

    setTimeout(() => setDetected(null), 1800);
  }, []);

  /** Detener cámara */
  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Autofocus / Exposición / Zoom */
  const applyEnhancements = useCallback(async (track: MediaStreamTrack) => {
    const caps = track.getCapabilities?.();
    if (!caps) return;

    const ext = caps as ExtendedCapabilities;
    const constraints: SafeConstraints = { advanced: [] };

    if (ext.focusMode?.includes("continuous"))
      constraints.advanced.push({ focusMode: "continuous" });

    if (ext.exposureMode?.includes("continuous"))
      constraints.advanced.push({ exposureMode: "continuous" });

    if (ext.zoom) {
      const min = ext.zoom.min ?? 1;
      const max = ext.zoom.max;
      const ideal = min + (max - min) * 0.40;
      constraints.advanced.push({ zoom: ideal });
    }

    try {
      await track.applyConstraints(constraints as MediaTrackConstraints);
    } catch (err) {
      console.error("Camera error:", err);
      onErrorRef.current?.(String(err));  // FIX CORRECTO
      setFocusing(false);
    }
  }, []);

  /** Iniciar cámara */
  const startCamera = useCallback(async () => {
    stopCamera();
    setFocusing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: false
      });

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      await applyEnhancements(track);

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      setTimeout(() => setFocusing(false), 600);

      const canvas =
        canvasRef.current ??
        (canvasRef.current = document.createElement("canvas"));
      const ctx = canvas.getContext("2d")!;
      const reader = readerRef.current;

      if (!ctx || !reader) return;

      scanningRef.current = true;

      /** LOOP */
      const loop = async () => {
        if (!scanningRef.current) return;
        if (!videoRef.current || !readerRef.current) return;

        const v = videoRef.current;
        const vw = v.videoWidth;
        const vh = v.videoHeight;
        if (!vw || !vh) return requestAnimationFrame(loop);

        /** ROI adaptado para laptop */
        let boxW = isLaptop ? vw * 0.95 : vw * 0.85;
        let boxH = isLaptop ? vh * 0.60 : vh * 0.28;

        if (failCountRef.current > 12) {
          boxW = isLaptop ? vw * 0.98 : vw * 0.90;
          boxH = isLaptop ? vh * 0.70 : vh * 0.35;
        }

        const sx = (vw - boxW) / 2;
        const sy = (vh - boxH) / 2;

        const SCALE = isLaptop ? 0.40 : 0.60;

        canvas.width = boxW * SCALE;
        canvas.height = boxH * SCALE;

        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(v, sx, sy, boxW, boxH, 0, 0, boxW, boxH);

        /** Sharpness pesado para laptop */
        if (isLaptop) {
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = img.data;
          const w = canvas.width;
          const h = canvas.height;

          const kernel = [
            0, -1, 0,
            -1, 6, -1,
            0, -1, 0
          ];

          const out = new Uint8ClampedArray(d);

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              for (let c = 0; c < 3; c++) {
                let sum = 0;
                let idx = 0;

                for (let ky = -1; ky <= 1; ky++) {
                  for (let kx = -1; kx <= 1; kx++) {
                    const px = ((y + ky) * w + (x + kx)) * 4 + c;
                    sum += d[px] * kernel[idx++];
                  }
                }

                const pos = (y * w + x) * 4 + c;
                out[pos] = Math.min(255, Math.max(0, sum));
              }
            }
          }

          img.data.set(out);
          ctx.putImageData(img, 0, 0);
        }

        /** Variantes */
        const variants: HTMLCanvasElement[] = [];

        for (let i = 0; i < 3; i++) {
          const line = document.createElement("canvas");
          const lctx = line.getContext("2d")!;
          const lh = canvas.height * 0.33;
          const ly = lh * i;

          line.width = canvas.width;
          line.height = lh;
          lctx.drawImage(canvas, 0, ly, canvas.width, lh, 0, 0, canvas.width, lh);

          variants.push(line);
        }

        /** Rotaciones para laptop */
        if (isLaptop) {
          const rotate = (src: HTMLCanvasElement, ang: number) => {
            const r = document.createElement("canvas");
            const rctx = r.getContext("2d")!;
            r.width = src.width;
            r.height = src.height;
            rctx.translate(r.width / 2, r.height / 2);
            rctx.rotate((ang * Math.PI) / 180);
            rctx.drawImage(src, -src.width / 2, -src.height / 2);
            return r;
          };

          variants.push(rotate(canvas, 5));
          variants.push(rotate(canvas, -5));
        }

        /** Intentos */
        for (const variant of variants) {
          try {
            const result = await readerRef.current.decodeFromCanvas(variant);
            if (result) {
              failCountRef.current = 0;
              const text = result.getText();
              notifyScan(text);
              onResult(text);
              scanningRef.current = false;
              stopCamera();
              return;
            }
          } catch (err) {
            if (!(err instanceof NotFoundException)) {
              onErrorRef.current?.(String(err));  // FIX CORRECTO
            }
          }
        }

        failCountRef.current++;
        setTimeout(loop, isLaptop ? 30 : 50);
      };

      loop();
    } catch (err) {
      onErrorRef.current?.(String(err));  // FIX CORRECTO
      setFocusing(false);
    }
  }, [applyEnhancements, notifyScan, onResult, stopCamera, isLaptop]);

  useEffect(() => {
    startCameraRef.current = startCamera;
  }, [startCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        className="w-full h-auto rounded-xl bg-black"
        playsInline
        muted
      />

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="border-4 border-green-400 rounded-xl w-3/4 h-1/2 shadow-[0_0_20px_rgba(0,255,0,0.7)] relative">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-green-400 animate-[scanline_2s_linear_infinite]" />
        </div>
      </div>

      {focusing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-3 py-1 rounded-lg shadow text-sm font-semibold animate-pulse">
          Enfocando…
        </div>
      )}

      {detected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-xl text-lg font-semibold animate-bounce">
          Código: {detected}
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

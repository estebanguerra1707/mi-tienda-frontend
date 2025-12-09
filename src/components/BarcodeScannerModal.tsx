import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export default function BarcodeScannerModal({ open, onClose, onDetected }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full bg-black text-white p-0">
        <DialogHeader>
          <DialogTitle className="text-center py-2">
            Escanear código de barras
          </DialogTitle>
        </DialogHeader>

        <div className="w-full h-[420px]">
          <BarcodeCameraScanner
            onResult={(code) => {
              onDetected(code);
              onClose();
            }}
            onError={(err) => console.error("Scanner error:", err)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

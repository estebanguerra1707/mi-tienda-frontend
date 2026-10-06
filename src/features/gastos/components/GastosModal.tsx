import { useState, useEffect } from "react";
import { GastoDTO, GastoRequestDTO } from "../api/gastosApi";

interface GastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GastoRequestDTO) => void;
  gastoEditando?: GastoDTO | null;
  isLoading: boolean;
}

export function GastoModal({ isOpen, onClose, onSave, gastoEditando, isLoading }: GastoModalProps) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaGasto, setFechaGasto] = useState("");

  useEffect(() => {
    if (gastoEditando) {
      setDescripcion(gastoEditando.descripcion);
      setMonto(gastoEditando.monto.toString());
      setFechaGasto(gastoEditando.fechaGasto);
    } else {
      setDescripcion("");
      setMonto("");
      setFechaGasto(new Date().toISOString().split("T")[0]);
    }
  }, [gastoEditando, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      descripcion,
      monto: Number(monto),
      fechaGasto,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">
            {gastoEditando ? "Editar Gasto" : "Nuevo Gasto"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ej. Compra de empaques, Gas..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input
              type="date"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              value={fechaGasto}
              onChange={(e) => setFechaGasto(e.target.value)}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : "Guardar Gasto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
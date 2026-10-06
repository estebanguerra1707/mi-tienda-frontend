import { useState } from "react";
import { useGastos } from "./hooks/useGastos";
import { GastoModal } from "./components/GastosModal";
import { GastoDTO, GastoRequestDTO } from "./api/gastosApi";

export default function GastosPage() {
  const { query, createMutation, updateMutation, deleteMutation } = useGastos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<GastoDTO | null>(null);

  const gastos = query.data || [];

  const handleOpenNew = () => {
    setGastoEditando(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (gasto: GastoDTO) => {
    setGastoEditando(gasto);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este gasto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (data: GastoRequestDTO) => {
    if (gastoEditando) {
      updateMutation.mutate(
        { id: gastoEditando.id, data },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

  return (
    <div className="px-4 sm:px-6 py-4 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Gastos Operativos</h1>
          <p className="text-slate-500 text-sm sm:text-base">Administra los gastos de la sucursal.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition"
        >
          + Registrar Gasto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {query.isLoading ? (
          <p className="text-center py-10 text-slate-500">Cargando gastos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Descripción</th>
                  <th className="px-6 py-4 font-semibold text-right">Monto</th>
                  <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gastos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No hay gastos registrados.
                    </td>
                  </tr>
                ) : (
                  gastos.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-slate-600">{gasto.fechaGasto}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{gasto.descripcion}</td>
                      <td className="px-6 py-4 font-bold text-red-500 text-right">
                        -{formatMoney(gasto.monto)}
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-3">
                        <button
                          onClick={() => handleOpenEdit(gasto)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(gasto.id)}
                          className="text-slate-400 hover:text-red-600 font-medium text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GastoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        gastoEditando={gastoEditando}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
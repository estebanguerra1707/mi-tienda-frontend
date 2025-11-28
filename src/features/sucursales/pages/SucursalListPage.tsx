import { useEffect, useState } from "react";
import { getSucursales } from "../sucursales.api";
import { Sucursal } from "../types";
import { useAuth } from "@/hooks/useAuth";
import AddSucursalButton from "@/features/sucursales/components/AddSucursalButton";
import EditSucursalButton from "@/features/sucursales/components/EditSucursalButton";
import DeleteSucursalButton from "@/features/sucursales/components/DeleteSucursalButton";


export default function SucursalListPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const { hasRole } = useAuth();
  const isSuper = hasRole("SUPER_ADMIN");

  const loadData = async () => {
    const data = await getSucursales();
    setSucursales(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-semibold">Sucursales</h1>
        {isSuper && (
          <AddSucursalButton onCreated={() => loadData()} />
        )}
      </div>

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Dirección</th>
            <th className="border px-2 py-1">Teléfono</th>
            {isSuper && (
                <th className="border px-2 py-1">Tipo de negocio</th>
            )}
            <th className="border px-2 py-1">Activo</th>
            {isSuper && <th className="border px-2 py-1">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {sucursales.map((s) => (
            <tr key={s.id}>
              <td className="border px-2 py-1">{s.id}</td>
              <td className="border px-2 py-1">{s.name}</td>
              <td className="border px-2 py-1">{s.address}</td>
              <td className="border px-2 py-1">{s.phone}</td>
             {isSuper && (
                <td className="border px-2 py-1">{s.businessTypeName}</td>
              )}
              <td className="border px-2 py-1">{s.active ? "Sí" : "No"}</td>
              {isSuper && (
                <td className="border px-2 py-1 flex gap-2">
                  <EditSucursalButton id={s.id} onUpdated={() => loadData()} />
                  <DeleteSucursalButton
                        id={s.id}
                        name={s.name}
                        onDeleted={loadData}   // para refrescar la tabla
                    />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

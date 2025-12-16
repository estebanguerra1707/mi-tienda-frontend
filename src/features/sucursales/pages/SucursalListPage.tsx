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
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
        Sucursales
      </h1>

      {isSuper && (
        <AddSucursalButton onCreated={() => loadData()} />
      )}
    </div>

    {/* TABLE WRAPPER */}
    <div className="
      overflow-x-auto 
      bg-white 
      rounded-xl 
      shadow 
      border border-gray-200
    ">
      <table className="min-w-full text-sm text-gray-700">
        
        {/* TABLE HEADER */}
        <thead>
          <tr className="
            bg-gray-50 
            text-gray-600 
            uppercase 
            text-xs 
            tracking-wide 
            border-b
          ">
            <th className="px-4 py-3 text-left font-semibold">ID</th>
            <th className="px-4 py-3 text-left font-semibold">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold">Dirección</th>
            <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
            {isSuper && (
              <th className="px-4 py-3 text-left font-semibold">Tipo de negocio</th>
            )}
            <th className="px-4 py-3 text-left font-semibold">Activo</th>
            {isSuper && (
              <th className="px-4 py-3 text-left font-semibold w-40">Acciones</th>
            )}
          </tr>
        </thead>

        {/* TABLE BODY */}
        <tbody className="divide-y divide-gray-200">
          {sucursales.map((s) => (
            <tr 
              key={s.id} 
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap">{s.id}</td>
              <td className="px-4 py-3 max-w-[200px] truncate">{s.name}</td>
              <td className="px-4 py-3 max-w-[240px] truncate">{s.address}</td>
              <td className="px-4 py-3">{s.phone}</td>

              {isSuper && (
                <td className="px-4 py-3">{s.businessTypeName}</td>
              )}

              {/* BADGE Activo */}
              <td className="px-4 py-3">
                <span
                  className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                    ${s.active 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"}
                  `}
                >
                  {s.active ? "Sí" : "No"}
                </span>
              </td>

              {/* ACCIONES */}
              {isSuper && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-3">

                    <EditSucursalButton 
                      id={s.id} 
                      onUpdated={() => loadData()} 
                    />

                    <DeleteSucursalButton
                      id={s.id}
                      name={s.name}
                      onDeleted={loadData}
                    />

                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  </div>
  );

}

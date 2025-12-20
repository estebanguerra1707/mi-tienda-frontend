// src/features/proveedores/pages/ProveedorListPage.tsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { deleteProveedor, fetchProveedores } from "../proveedores.api";
import type { Proveedor } from "../types";

export default function ProveedorListPage() {
  const [data, setData] = useState<Proveedor[]>([]);

  useEffect(() => {
    fetchProveedores().then(setData);
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return;
    await deleteProveedor(id);
    setData((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to="/proveedores/nuevo" className="px-4 py-2 rounded bg-blue-600 text-white">
          Nuevo proveedor
        </Link>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">ID</th>
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Correo</th>
            <th className="border p-2">Tipo de negocio</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p: Proveedor) => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">{p.email ?? "—"}</td>
              <td className="border p-2">{p.tipoNegocioNombre ?? "—"}</td>
              <td className="border p-2 space-x-2">
                <Link to={`/proveedores/${p.id}/editar`} className="text-blue-600 hover:underline">
                  Editar
                </Link>
                <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                Sin datos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getSucursalById, updateSucursal } from "../sucursales.api";
import SucursalForm from "../components/SucursalForm";
import { useNavigate, useParams } from "react-router-dom";
import { Sucursal } from "../types";

import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";


export default function SucursalEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
 useEffect(() => {
    if (id) getSucursalById(Number(id)).then(setSucursal);
  }, [id]);

  const { user } = useAuth();


if (!user || user.role !== "SUPER_ADMIN")
  return <Navigate to="/sucursales" replace />;

  const handleSubmit = async (data: Partial<Sucursal>): Promise<void> => {
    if (!id) return;
    await updateSucursal(Number(id), data);
    navigate("/sucursales");
  };

  if (!sucursal) return <p className="p-4">Cargando...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4 font-semibold">Editar sucursal</h1>
      <SucursalForm initialData={sucursal} onSubmit={handleSubmit} isEditing />
    </div>
  );
}

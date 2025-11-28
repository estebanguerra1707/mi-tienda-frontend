import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProveedorForm from "../components/ProveedoresForm";
import { useProveedorById, useUpdateProveedor } from "@/hooks/useProveedores";
import type { UpdateProveedorDto } from "../types";

export default function ProveedoresEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: proveedor, isLoading } = useProveedorById(Number(id));
  const update = useUpdateProveedor();

  const handleSubmit = async (data: UpdateProveedorDto) => {
    await update.mutateAsync({ id: Number(id), payload: data });
    toast.success("Proveedor actualizado correctamente");
    navigate("/proveedores");
  };

  if (isLoading) return <p className="p-4">Cargando...</p>;
  if (!proveedor) return <p className="p-4">No encontrado</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4 font-semibold">Editar proveedor</h1>
      <ProveedorForm initialData={proveedor} onSubmit={handleSubmit} isEditing />
    </div>
  );
}

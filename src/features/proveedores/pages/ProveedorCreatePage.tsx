import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProveedorForm from "../components/ProveedoresForm";
import { useCreateProveedor } from "@/hooks/useProveedores";
import type { CreateProveedorDto } from "../types";

export default function ProveedorCreatePage() {
  const navigate = useNavigate();
  const create = useCreateProveedor();

  const handleSubmit = async (data: CreateProveedorDto) => {
    await create.mutateAsync(data);
    toast.success("Proveedor creado correctamente");
    navigate("/proveedores");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4 font-semibold">Nuevo proveedor</h1>
      <ProveedorForm onSubmit={handleSubmit} />
    </div>
  );
}

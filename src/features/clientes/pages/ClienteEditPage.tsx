import { useNavigate, useParams } from "react-router-dom";
import ClienteForm, { ClienteFormValues } from "../components/ClienteForm";
import { toast } from "react-hot-toast";
import { useCliente, useUpdateCliente } from "../useClients";
import type { ClienteDTO } from "../types";
import { useAuth } from "@/hooks/useAuth";


export default function ClienteEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const clienteId = Number(id);
  const validId = Number.isFinite(clienteId) && clienteId > 0;

  const { data: cliente, isLoading, isError } = useCliente(validId ? clienteId : undefined);
  const updateMutation = useUpdateCliente();
  const auth = useAuth();
const role = auth.user?.role;
const canManageBranches = role === "ADMIN" || role === "SUPER_ADMIN";

  const onSubmit = async (values: ClienteFormValues) => {
    if (!validId) return;

    const payload: ClienteDTO = {
      name: values.name.trim(),
      phone: values.phone ?? null,
      email: values.email ?? null,
      ...(canManageBranches ? { branchIds: values.branchIds ?? [] } : {}),
    };

    await updateMutation.mutateAsync({ id: clienteId, payload });

    toast.success("Cliente actualizado");
    navigate("/clientes");
  };

  if (!validId) {
    return <div className="p-6">ID inválido</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
        <h1 className="text-3xl font-bold">Editar cliente</h1>
        <p className="text-sm text-slate-600 mt-1">Actualiza la información del cliente</p>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-slate-600">Cargando…</div>
          ) : isError ? (
            <div className="text-slate-600">No se pudo cargar el cliente</div>
          ) : (
            <ClienteForm
              initialData={cliente ?? null}
              onSubmit={onSubmit}
              isEditing
              showBranch={canManageBranches}
            />
          )}
        </div>
      </div>
    </div>
  );
}

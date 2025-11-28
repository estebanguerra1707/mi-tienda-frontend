import { useState,useEffect } from "react";
import { Sucursal } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";


interface Props {
  initialData?: Partial<Sucursal>;
  onSubmit: (data: Partial<Sucursal>) => void;
  isEditing?: boolean;
}

export default function SucursalForm({ initialData = {}, onSubmit, isEditing = false }: Props) {
  const [form, setForm] = useState<Partial<Sucursal>>(initialData);
  
const { user } = useAuth();

const [businessTypes, setBusinessTypes] = useState<{ id: number; name: string }[]>([]);

useEffect(() => {
  const loadBusinessTypes = async () => {
    if (user?.role === "SUPER_ADMIN") {
      const { data } = await api.get("/business-types"); // ajusta ruta si es distinta
      setBusinessTypes(data);
      // si vienes vacío, que el select empiece vacío:
      setForm((prev) => ({ ...prev, businessTypeId: prev.businessTypeId ?? undefined }));
    } else {
      setForm(prev => ({
        ...prev,
        businessTypeId: user?.businessType ?? undefined, // null -> undefined
      }));
}
  };
  loadBusinessTypes();
}, [user]);


const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const target = e.target;
  const name = target.name;

  if (name === "businessTypeId") {
    const value = (target as HTMLSelectElement).value;
    setForm({ ...form, businessTypeId: value ? Number(value) : undefined });
    return;
  }

  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    setForm({ ...form, [name]: target.checked });
    return;
  }

  setForm({ ...form, [name]: (target as HTMLInputElement | HTMLSelectElement).value });
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessTypeId) {
      alert("Selecciona un tipo de negocio");
      return;
     }
    onSubmit(form);

    
  };



  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="flex flex-col gap-1">
        <span>Nombre</span>
        <input
          name="name"
          value={form.name || ""}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Dirección</span>
        <input
          name="address"
          value={form.address || ""}
          onChange={handleChange}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Teléfono</span>
        <input
          name="phone"
          value={form.phone || ""}
          onChange={handleChange}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name="isAlertaStockCritico"
        checked={form.isAlertaStockCritico || false}
        onChange={handleChange}
       />
        <span>Activar alerta de stock crítico</span>
      </label>

        {user?.role === "SUPER_ADMIN" ? (
          <label className="flex flex-col gap-1">
            <span>Tipo de negocio</span>
            <select
              name="businessTypeId"
              value={form.businessTypeId ?? ""}
              onChange={handleChange}
              className="border rounded px-3 py-2"
              required
            >
              <option value="">-- Selecciona un tipo de negocio --</option>
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>{bt.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <>
            {/* Visible solo como lectura para ADMIN/VENDOR */}
            <label className="flex flex-col gap-1">
              <span>Tipo de negocio</span>
              <input
                className="border rounded px-3 py-2 bg-slate-100"
                readOnly
                value={form.businessTypeId ?? user?.businessType ?? ""}
              />
            </label>
            {/* Campo oculto para enviar al backend */}
            <input type="hidden" name="businessTypeId" value={form.businessTypeId ?? ""} />
          </>
        )}
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 transition"
      >
        {isEditing ? "Guardar cambios" : "Crear sucursal"}
      </button>
    </form>
  );
}

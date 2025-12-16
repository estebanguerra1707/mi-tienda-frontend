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
   <form
  onSubmit={handleSubmit}
  className="
    grid gap-5 
    bg-white 
    p-4 sm:p-6 
    rounded-xl 
    shadow-sm 
    border border-gray-200 
    max-w-3xl 
    mx-auto 
    w-full
  "
>

  {/* Nombre */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">Nombre</label>
    <input
      name="name"
      value={form.name || ""}
      onChange={handleChange}
      required
      className="
        px-4 py-2.5 
        rounded-lg 
        border border-gray-300 
        bg-gray-50
        focus:bg-white
        focus:ring-2 
        focus:ring-blue-500 
        outline-none 
        transition
        text-gray-800
      "
    />
  </div>

  {/* Dirección */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">Dirección</label>
    <input
      name="address"
      value={form.address || ""}
      onChange={handleChange}
      className="
        px-4 py-2.5 
        rounded-lg 
        border border-gray-300 
        bg-gray-50
        focus:bg-white
        focus:ring-2 
        focus:ring-blue-500 
        outline-none 
        transition
      "
    />
  </div>

  {/* Teléfono */}
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">Teléfono</label>
    <input
      name="phone"
      value={form.phone || ""}
      onChange={handleChange}
      className="
        px-4 py-2.5 
        rounded-lg 
        border border-gray-300 
        bg-gray-50
        focus:bg-white
        focus:ring-2 
        focus:ring-blue-500
        outline-none 
        transition
      "
    />
  </div>

  {/* Checkbox */}
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      name="isAlertaStockCritico"
      checked={form.isAlertaStockCritico || false}
      onChange={handleChange}
      className="
        h-4 w-4 
        rounded 
        text-blue-600 
        border-gray-400 
        focus:ring-blue-500
      "
    />
    <label className="text-sm text-gray-700">Activar alerta de stock crítico</label>
  </div>

  {/* Tipo de negocio */}
  {user?.role === "SUPER_ADMIN" ? (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Tipo de negocio</label>
      <select
        name="businessTypeId"
        value={form.businessTypeId ?? ""}
        onChange={handleChange}
        required
        className="
          px-4 py-2.5 
          rounded-lg 
          border border-gray-300 
          bg-gray-50
          focus:bg-white
          focus:ring-2 
          focus:ring-blue-500 
          outline-none 
          transition
        "
      >
        <option value="">-- Selecciona un tipo de negocio --</option>
        {businessTypes.map((bt) => (
          <option key={bt.id} value={bt.id}>
            {bt.name}
          </option>
        ))}
      </select>
    </div>
  ) : (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Tipo de negocio</label>
        <input
          className="
            px-4 py-2.5 
            rounded-lg 
            border border-gray-300 
            bg-gray-100
            text-gray-600
          "
          readOnly
          value={form.businessTypeId ?? user?.businessType ?? ""}
        />
      </div>

      <input type="hidden" name="businessTypeId" value={form.businessTypeId ?? ""} />
    </>
  )}

  {/* Botón enviar */}
  <button
    type="submit"
    className="
      w-full sm:w-auto 
      px-6 py-2.5 
      mt-2
      rounded-lg 
      text-white 
      font-medium 
      bg-blue-600 
      hover:bg-blue-700 
      shadow 
      transition
    "
  >
    {isEditing ? "Guardar cambios" : "Crear sucursal"}
  </button>
</form>
  );
}

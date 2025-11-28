import { useParams, useNavigate, } from "react-router-dom";
import { useEffect, useState} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserById } from "@/features/usuarios/useUserById";
import { useUpdateUser } from "@/features/usuarios/useUpdateUser";
import { toast } from "react-hot-toast";
import { UpdateUserPayload } from "@/types/catalogs";

const ROLES = ["ADMIN", "VENDOR", "SUPER_ADMIN"] as const;

const userSchema = z.object({
  username: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  role: z.enum(ROLES),
  changePassword: z.boolean(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})
  .refine((data) => {
    // Si NO desea cambiar la contraseña → no validar nada
    if (!data.changePassword) return true;

    // Si sí desea cambiarla → validar campos obligatorios
    return (
      data.currentPassword &&
      data.newPassword &&
      data.confirmPassword
    );
  }, {
    message: "Todos los campos de contraseña son obligatorios",
    path: ["currentPassword"],
  })
  .refine((data) => {
    if (!data.changePassword) return true;
    return data.newPassword !== data.currentPassword;
  }, {
    message: "La nueva contraseña no puede ser igual a la actual",
    path: ["newPassword"],
  })
  .refine((data) => {
    if (!data.changePassword) return true;
    return data.newPassword === data.confirmPassword;
  }, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });


type FormValues = z.infer<typeof userSchema>;

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading } = useUserById(Number(id));
  const { mutateAsync: updateUser, isPending } = useUpdateUser();
   const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch, 
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(userSchema),
  });

    const changePassword = watch("changePassword");

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload: UpdateUserPayload = {
      username: values.username,
      email: values.email,
      role: values.role,
    };

    if (values.changePassword) {
      payload.currentPassword = values.currentPassword;
      payload.newPassword = values.newPassword;
    }
    try {
      await updateUser({ id: Number(id), payload: values });
      toast.success("Usuario actualizado correctamente");
      navigate("/usuarios");
    } catch {
      toast.error("Error al actualizar el usuario");
    }
    
  };

  if (isLoading) return <p className="p-4">Cargando usuario...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Editar usuario</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Usuario */}
        <div>
          <label className="block text-sm mb-1">Nombre de usuario</label>
          <input className="border rounded px-3 py-2 w-full" {...register("username")} />
          {errors.username && <p className="text-red-600 text-xs">{errors.username.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="border rounded px-3 py-2 w-full" {...register("email")} />
          {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm mb-1">Rol</label>
          <select className="border rounded px-3 py-2 w-full" {...register("role")}>
            <option value="">Selecciona un rol...</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="VENDOR">VENDOR</option>
          </select>
          {errors.role && <p className="text-red-600 text-xs">{errors.role.message}</p>}
        </div>

        {/* Switch cambio contraseña */}
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("changePassword")} />
          <label className="text-sm">¿Deseas cambiar la contraseña?</label>
        </div>

        {changePassword && (
          <div className="space-y-3 border p-4 rounded bg-gray-50 mt-2">

            <div>
              <label className="block text-sm mb-1">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="border rounded px-3 py-2 w-full"
                  {...register("currentPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-2 text-gray-600"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? "🙈" : "👁️"}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-600 text-xs">{errors.currentPassword.message}</p>
              )}
            </div>
            <div>
                <label className="block text-sm mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    className="border rounded px-3 py-2 w-full"
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2 text-gray-600"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-600 text-xs">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="border rounded px-3 py-2 w-full"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2 text-gray-600"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs">{errors.confirmPassword.message}</p>
                )}
          </div>

          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

const schema = z.object({
  newPassword: z.string().min(6, "Debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Debe tener al menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{type:"ok"|"error", message:string}|null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      setResult({ type: "error", message: "Token inválido o inexistente." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/usuarios/reset-password?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: values.newPassword }),
      });

      const text = await res.text();

      if (!res.ok) {
        if (text.includes("TOKEN_EXPIRED")) {
            navigate("/token-expired");
            return;
        }

        // 👉 Detectar token ya usado
        if (text.includes("TOKEN_ALREADY_USED")) {
            navigate("/token-expired");
            return;
        }

        // 👉 Otros errores
        setResult({ type: "error", message: text || "Error al restablecer la contraseña" });
        return;
        } else {
        setResult({ type: "ok", message: "Contraseña restablecida correctamente." });

        setTimeout(() => navigate("/login"), 2000);
      }

    } catch (e) {
        const message =
            e instanceof Error ? e.message : "Error inesperado al procesar la petición";

        setResult({ type: "error", message });
        }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Restablecer contraseña</h1>
          <p className="text-sm text-gray-500">Ingresa tu nueva contraseña</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="text-sm font-medium">Nueva contraseña</label>
            <input
              type="password"
              className="border rounded-lg px-3 py-2 w-full focus:ring focus:ring-indigo-200"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-red-600 text-xs">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Confirmar contraseña</label>
            <input
              type="password"
              className="border rounded-lg px-3 py-2 w-full focus:ring focus:ring-indigo-200"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition 
            ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {loading ? "Procesando..." : "Restablecer contraseña"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </form>

        {result && (
          <div
            className={`rounded-lg p-3 text-sm border ${
              result.type === "ok"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

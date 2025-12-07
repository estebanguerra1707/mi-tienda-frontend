import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Correo inválido").min(1, "Requerido"),
  password: z.string().min(5, "Mínimo 5 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    await login(data.email, data.password);
    nav(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* Fondo con imagen desde /public */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/fondo.png')",
        }}
      />


      {/* Tarjeta del login estilo glassmorphism */}
      <div className="relative mx-auto max-w-md w-full p-8
        bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl
        border border-white/20">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo001.png"
            alt="Mi Inventario"
            className="w-24 drop-shadow-2xl select-none"
          />
        </div>

        <h1 className="text-white text-3xl font-bold text-center mb-8">
          Bienvenido a Mi Inventario
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Usuario */}
          <div>
            <label className="block text-sm text-white/80 mb-1">Usuario</label>
            <input
              className="w-full border border-white/20 bg-white/10 text-white
              rounded-xl px-4 py-3 focus:outline-none focus:ring-2
              focus:ring-blue-400 placeholder-white/40"
              placeholder="Correo electrónico"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm text-white/80 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border border-white/20 bg-white/10 text-white
              rounded-xl px-4 py-3 focus:outline-none focus:ring-2
              focus:ring-blue-400 placeholder-white/40"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}

            {/* Recuperar contraseña */}
            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-300 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-semibold text-lg
            px-4 py-3 rounded-xl hover:bg-blue-700 transition
            disabled:opacity-50"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

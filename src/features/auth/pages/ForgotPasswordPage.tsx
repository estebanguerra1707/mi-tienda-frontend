import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "ok" | "error"; message: string } | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!API_BASE) {
      setResult({ type: "error", message: "Falta VITE_API_BASE_URL en el .env.local" });
      return;
    }

    setLoading(true);

  try {
  const res = await fetch(`${API_BASE}/usuarios/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let errorMessage = "Error desconocido";

    try {
            const data = await res.json();
            errorMessage = data.message ?? JSON.stringify(data);
            } catch {
            const text = await res.text();
            errorMessage = text || "Error desconocido";
            }

            setResult({ type: "error", message: errorMessage });
        } else {
            setResult({
            type: "ok",
            message: "Si el correo existe, se ha enviado el enlace para restablecer la contraseña.",
            });
        }

        } catch {
        setResult({ type: "error", message: "Error de red" });
        } finally {
        setLoading(false);
        }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6">
        
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
          <p className="text-sm text-gray-500">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Correo electrónico</span>
            <input
              type="email"
              className="border rounded-lg px-3 py-2 w-full focus:ring focus:ring-indigo-200"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={!isValidEmail || loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              !isValidEmail || loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
          >
            Volver al login
          </button>
        </form>

        {result && (
          <div
            className={`rounded-lg p-3 text-sm border ${
              result.type === "ok"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

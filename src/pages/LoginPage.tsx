// src/features/auth/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAxiosError } from "axios";

type FromState = { from?: { pathname: string } };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);

      const state = location.state as FromState | null;
      const from = state?.from?.pathname ?? "/";

      navigate(from, { replace: true });
    } catch (e: unknown) {
      let msg = "Error de autenticación";
      if (isAxiosError(e)) {
        msg = (e.response?.data as { message?: string })?.message ?? msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded-xl">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <label className="block">
          <span className="text-sm">Email</span>
          <input className="mt-1 w-full border rounded px-3 py-2"
                 type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input className="mt-1 w-full border rounded px-3 py-2"
                 type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </label>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="w-full rounded-lg px-4 py-2 border">
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

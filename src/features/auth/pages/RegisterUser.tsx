import React, { useMemo, useState } from "react";

// If you use React Router, you can drop this component into a route like
// <Route path="/admin/register" element={<RegisterUser />} />
// Make sure you have VITE_API_BASE_URL in your .env.local

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

// Minimal roles. Adjust to match your backend enum/allowed values.
const ROLES = ["SUPER_ADMIN", "ADMIN", "VENDOR"] as const;

type Role = typeof ROLES[number];

type FormState = {
  userName: string;
  email: string;
  password: string;
  role: Role;
};

export default function RegisterUser() {
  const [form, setForm] = useState<FormState>({
    userName: "",
    email: "",
    password: "",
    role: "VENDOR",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { type: "ok" | "error"; message: string }>(null);

  const disabled = useMemo(() => {
    if (!API_BASE) return true;
    return !form.userName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || form.password.length < 4;
}, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!API_BASE) {
      setResult({ type: "error", message: "Falta VITE_API_BASE_URL en tu .env.local" });
      return;
    }

    setLoading(true);
    try {
     const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include",
    });

    const text = await res.text();
    console.log(JSON.stringify(form));
    if (!res.ok) {
      try {
        const j = JSON.parse(text);
        setResult({ type: "error", message: j.message || JSON.stringify(j) });
      } catch {
        setResult({ type: "error", message: text || `HTTP ${res.status}` });
      }
    } else {
      setResult({ type: "ok", message: "Usuario creado correctamente" });
      setForm(f => ({ ...f, password: "" }));
    }

  } catch (err: unknown) {
    // 👇 Narrowing correcto para unknown
    const msg = err instanceof Error ? err.message : "Error de red";
    setResult({ type: "error", message: msg });

  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Registrar usuario</h1>
          <p className="text-sm text-gray-500">
            Enviará un <code className="px-1 py-0.5 bg-gray-100 rounded">POST /auth/register</code> al backend.
          </p>
          {!API_BASE && (
            <p className="text-red-600 text-sm font-medium">
              ⚠️ No encuentro <code>VITE_API_BASE_URL</code>. Configúralo en tu <code>.env.local</code>.
            </p>
          )}
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Nombre</span>
              <input
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
                name="userName"
                placeholder="Nombre Usuario"
                value={form.userName}
                onChange={handleChange}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Email</span>
              <input
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
                name="email"
                type="email"
                placeholder="correo@dominio.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-1">
              <span className="text-sm font-medium">Rol</span>
              <select
                name="role"
                className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-indigo-200"
                value={form.role}
                onChange={handleChange}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Contraseña</span>
              <div className="relative">
                <input
                  className="border rounded-lg w-full px-3 py-2 pr-10 focus:outline-none focus:ring focus:ring-indigo-200"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-indigo-600 hover:underline"
                >
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
              <span className="text-xs text-gray-500">Mínimo 4 caracteres (ajusta la validación si necesitas).</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={disabled || loading}
            className={`w-full rounded-lg px-4 py-2 font-medium text-white transition ${
              disabled || loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Registrando..." : "Registrar usuario"}
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

        <footer className="text-xs text-gray-500">
          Base URL: <code className="bg-gray-100 px-1 py-0.5 rounded">{API_BASE || "(no definida)"}</code>
        </footer>
      </div>
    </div>
  );
}

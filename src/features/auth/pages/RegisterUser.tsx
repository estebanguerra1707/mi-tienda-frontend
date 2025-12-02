import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/*                                CONFIG API                                  */
/* -------------------------------------------------------------------------- */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

const ROLES = ["SUPER_ADMIN", "ADMIN", "VENDOR"] as const;
type Role = (typeof ROLES)[number];

type FormState = {
  userName: string;
  email: string;
  password: string;
  role: Role;
};

/* -------------------------------------------------------------------------- */
/*                           COMPONENTE REGISTRO                               */
/* -------------------------------------------------------------------------- */

export default function RegisterUser() {
  const navigate = useNavigate();   // 👈 para redirigir al login

  const [form, setForm] = useState<FormState>({
    userName: "",
    email: "",
    password: "",
    role: "VENDOR",
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { type: "ok" | "error"; message: string }>(
    null
  );

  const disabled = useMemo(() => {
    if (!API_BASE) return true;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

    return !form.userName.trim() || !validEmail || form.password.length < 4;
  }, [form]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!API_BASE) {
      setResult({
        type: "error",
        message: "⚠️ Falta configurar VITE_API_BASE_URL en .env.local",
      });
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

      if (!res.ok) {
        try {
          const json = JSON.parse(text);
          setResult({
            type: "error",
            message: json.message || JSON.stringify(json),
          });
        } catch {
          setResult({
            type: "error",
            message: text || `HTTP ${res.status}`,
          });
        }
      } else {
        setResult({ type: "ok", message: "✨ Usuario creado correctamente" });
        setForm((f) => ({ ...f, password: "" }));
      }
    } catch (e: unknown) {
      setResult({
        type: "error",
        message: e instanceof Error ? e.message : "Error de red",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- UI / UX ---------------------------------- */

  const inputStyle =
    "border border-slate-300 rounded-lg px-3 py-2 bg-white shadow-sm " +
    "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none " +
    "transition-all placeholder:text-slate-400";

  const labelStyle = "text-sm font-medium text-slate-700";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">

        {/* ---------------------- HEADER ---------------------- */}
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800">
            Crear usuario
          </h1>
          <p className="text-sm text-slate-500">
            Este formulario enviará un{" "}
            <code className="bg-slate-100 px-1 py-0.5 rounded">POST /auth/register</code>.
          </p>

          {!API_BASE && (
            <p className="text-red-600 text-sm font-semibold">
              ⚠️ Falta configurar <code>VITE_API_BASE_URL</code>.
            </p>
          )}
        </header>

        {/* ---------------------- FORMULARIO ---------------------- */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Nombre */}
            <label className="flex flex-col gap-1">
              <span className={labelStyle}>Nombre</span>
              <input
                name="userName"
                className={inputStyle}
                placeholder="Juan Pérez"
                value={form.userName}
                onChange={handleChange}
              />
            </label>

            {/* Email */}
            <label className="flex flex-col gap-1">
              <span className={labelStyle}>Correo electrónico</span>
              <input
                name="email"
                type="email"
                className={inputStyle}
                placeholder="correo@dominio.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            {/* Rol */}
            <label className="flex flex-col gap-1">
              <span className={labelStyle}>Rol</span>
              <select
                name="role"
                className={`${inputStyle} bg-white`}
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

            {/* Contraseña */}
            <label className="flex flex-col gap-1">
              <span className={labelStyle}>Contraseña</span>

              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  className={`${inputStyle} pr-12`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 hover:underline"
                >
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>
          </div>

          {/* ---------------------- BOTONES ---------------------- */}
          <div className="flex flex-col gap-3 pt-4">

            {/* Botón registrar */}
            <button
              type="submit"
              disabled={disabled || loading}
              className={[
                "w-full py-3 rounded-lg font-medium text-white transition-all shadow",
                disabled || loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[.98]",
              ].join(" ")}
            >
              {loading ? "Registrando..." : "Registrar usuario"}
            </button>

            {/* Botón cancelar → LOGIN */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="
                w-full py-3 rounded-lg font-medium 
                border border-slate-300 bg-white 
                hover:bg-slate-100 active:scale-[.98] transition
              "
            >
              Cancelar y volver al login
            </button>
          </div>
        </form>

        {/* ---------------------- RESULTADO ---------------------- */}
        {result && (
          <div
            className={[
              "rounded-lg p-4 text-sm border animate-fade-in",
              result.type === "ok"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700",
            ].join(" ")}
          >
            {result.message}
          </div>
        )}

        {/* ---------------------- FOOTER ---------------------- */}
        <footer className="pt-2 text-xs text-slate-500">
          Base URL:{" "}
          <code className="px-1 py-0.5 rounded bg-slate-100">
            {API_BASE || "No definida"}
          </code>
        </footer>
      </div>
    </div>
  );
}

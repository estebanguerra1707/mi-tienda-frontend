"use client";

import { UseFormRegisterReturn } from "react-hook-form";

interface FormSelectProps {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function FormSelect({
  label,
  register,
  error,
  children,
  className = "",
  onChange,
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-medium">{label}</label>

      <select
        {...register}
        onChange={(e) => {
          // 👉 MANTENEMOS LA INTEGRACIÓN CON react-hook-form
          register.onChange(e);

          // 👉 Ejecutamos tu lógica personalizada (EFECTIVO / NO EFECTIVO)
          if (onChange) onChange(e);
        }}
        className={`border rounded px-3 py-2 text-sm w-full ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
      >
        {children}
      </select>

      {error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

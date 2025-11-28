import React from "react";

interface CardProps {
  titulo: string;
  valor: number | string;
}

export function Card({ titulo, valor }: CardProps) {
  return (
    <div className="p-4 border rounded shadow bg-white">
      <h3 className="text-sm text-gray-500">{titulo}</h3>
      <p className="text-2xl font-bold mt-1">{valor}</p>
    </div>
  );
}

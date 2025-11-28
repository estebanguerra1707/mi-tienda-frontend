import { useEffect, useState } from "react";
import { listarProductos, Producto } from "../services/productos.service";

export default function ProductosList() {
  const [data, setData] = useState<Producto[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    listarProductos().then(setData).catch(e=>{
      setErr(e?.response?.data?.message ?? "Error");
    });
  }, []);

  if (err) return <p className="p-4 text-red-600">{err}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Productos</h1>
      <ul className="space-y-2">
        {data.map(p => (
          <li key={p.id} className="border rounded p-3">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm opacity-80">SKU: {p.sku}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

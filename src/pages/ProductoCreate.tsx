import { useState } from "react";
import { crearProducto } from "../services/productos.service";

export default function ProductoCreate() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await crearProducto({ name, sku, purchasePrice, stock });
    setMsg("Producto creado");
  }

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">Nuevo producto</h2>
      <input className="border rounded px-3 py-2 w-full" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full" placeholder="SKU" value={sku} onChange={e=>setSku(e.target.value)} />
      <input className="border rounded px-3 py-2 w-full" type="number" placeholder="Precio compra" value={purchasePrice} onChange={e=>setPurchasePrice(parseFloat(e.target.value))} />
      <input className="border rounded px-3 py-2 w-full" type="number" placeholder="Stock" value={stock} onChange={e=>setStock(parseInt(e.target.value))} />
      <button className="border rounded px-4 py-2">Guardar</button>
      {msg && <p className="text-green-700">{msg}</p>}
    </form>
  );
}

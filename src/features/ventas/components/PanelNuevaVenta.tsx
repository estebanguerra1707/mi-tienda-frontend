"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { z, ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateVenta } from "@/hooks/useVentas";
import { useClients } from "@/hooks/useClients";
import { usePaymentMethods } from "@/hooks/useCatalogs";
import { useProductsByBranch } from "@/hooks/useProductsByBranch";
import { useAuth } from "@/hooks/useAuth";
import type { ClientItem } from "@/hooks/useClients";
import type { CatalogItem } from "@/hooks/useCatalogs";
import type { ProductItem } from "@/types/product";
import { useBranches } from "@/hooks/useCatalogs";
import EnviarTicketModal from "@/features/ventas/components/EnviarTicketModal";
import ConfirmarVentaModal from "@/features/ventas/components/ConfirmarVentaModal";
import { ResumenVenta } from "@/types/catalogs";
import { toastError } from "@/lib/toast";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";
import { useDisableNumberWheel } from "@/hooks/useDisableNumberWheel";

import dayjs from "dayjs";
import "dayjs/locale/es";

/* ---------- Schema ---------- */
const schema = z.object({
  clientId: z.coerce.number().int().nonnegative().optional(), 
  referenceName: z.string().optional(),
  paymentMethodId: z.number().int().positive("Seleccione método de pago"),
  cashGiven: z.number().nonnegative().optional(),
  amountPaid: z.number().nonnegative().optional(),
  changeAmount: z.number().nonnegative().optional(),
  saleDate: z.string().optional(),
  emailList: z.array(z.string().email()).optional(),
  details: z
    .array(
      z.object({
        productId: z.number().min(1, "Seleccione un producto válido"),
        quantity: z.coerce.number().positive("Cantidad inválida"),
        ownerType: z.enum(["PROPIO", "CONSIGNACION"]).optional(),
        extras: z.array(z.object({
            productId: z.number()
        })).optional(), 
        notes: z.string().optional()
      })
    )
    .min(1, "Debe agregar al menos un producto"),
});

type VentaForm = z.infer<typeof schema>;
type UnidadUI = {
  label: string;
  step: number;
  min: number;
  esPieza: boolean;
  esMetro: boolean;
};

const getUnidadUI = (p: ProductItem): UnidadUI => {
  const code = (p.unidadMedidaCodigo ?? "").toUpperCase();
  const abbr = (p.unidadMedidaAbreviatura ?? "").trim();
  const esMetro = code === "METRO" || code === "M";
  const esPieza = p.permiteDecimales === false;

  const label =
    abbr ||
    (code ? code.toLowerCase() : "") ||
    (esPieza ? "pz" : esMetro ? "m" : "kg");

  const step = esPieza ? 1 : esMetro ? 0.1 : 0.01;
  const min = esPieza ? 1 : esMetro ? 0.1 : 0.01;

  return { label, step, min, esPieza, esMetro };
};

const makeZodResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

/* ---------- Componente ---------- */
export default function PanelNuevaVenta({ onCreated }: { onCreated: () => void }) {
  const { mutateAsync, isPending } = useCreateVenta();
  useDisableNumberWheel();
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");
  const userBranchId = auth.user?.branchId ?? null;

  const [isCash, setIsCash] = useState(false);
  const [localCash, setLocalCash] = useState("");
  const [saleDateDisplay, setSaleDateDisplay] = useState("");
  const [, setSaleDateLocal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [totalVenta, setTotalVenta] = useState<number>(0);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [ventaIdCreada, setVentaIdCreada] = useState<number | null>(null);

  const { data: clients } = useClients() as { data: ClientItem[] };
  const { data: paymentMethods } = usePaymentMethods() as { data: CatalogItem[] };
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [resumenVenta, setResumenVenta] = useState<ResumenVenta | null>(null);
  const ventaFormSnapshot = useRef<VentaForm | null>(null);
  const [extraProducts, setExtraProducts] = useState<ProductItem[]>([]);

  type BackendError = {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
    isSuper ? null : userBranchId
  );
  
  const branchesHook = useBranches({
    isSuper,
    businessTypeId: isSuper ? auth.user?.businessType ?? null : null,
    oneBranchId: !isSuper ? auth.user?.branchId ?? null : null,
  });

  const branches = useMemo(() => branchesHook.data ?? [], [branchesHook.data]);
  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId),
    [branches, selectedBranchId]
  );
  const usaInventarioPorDuenio = selectedBranch?.usaInventarioPorDuenio === true;
  const [isConfirming] = useState(false);

  const { data: productsRaw } = useProductsByBranch(
    selectedBranchId && selectedBranchId > 0 ? selectedBranchId : undefined
  );
  
  const products = useMemo(() => {
    const base = (() => {
      if (!productsRaw) return [];
      if (Array.isArray(productsRaw)) return productsRaw;
      if ("content" in productsRaw) return productsRaw.content ?? [];
      return [];
    })();
    return [...base, ...extraProducts];
  }, [productsRaw, extraProducts]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors }, 
  } = useForm<VentaForm>({
    resolver: makeZodResolver(schema),
    defaultValues: {
      clientId: 0,
      referenceName: "",
      paymentMethodId: 0,
      cashGiven: 0,
      amountPaid: 0,
      changeAmount: 0,
      emailList: [],
      details: [],
    },
  });

  const selectProductFromSearch = async (product: ProductItem) => {
    const u = getUnidadUI(product);
    append({
      productId: product.id,
      quantity: u.min,
      extras: [],
      notes: "",
      ownerType: usaInventarioPorDuenio ? "PROPIO" : undefined,
    });

    setSearchTerm("");
    setFilteredProducts([]);
    setActiveProductIndex(0);
    await trigger("details");
  };

  const handleBarcodeScan = async (code: string) => {
    if (!code || !products.length) return;
    
    const term = code.trim().toLowerCase();
    const found = products.find((p) => {
      return (
        (p.codigoBarras?.toString() ?? "").toLowerCase() === term ||
        (p.barcode?.toString() ?? "").toLowerCase() === term ||
        (p.sku?.toLowerCase() ?? "") === term
      );
    });

    if (found) {
      await selectProductFromSearch(found);
    } else {
      toastError(`No se encontró un producto con el código: ${code}`);
    }
  };
  const { fields, remove, append } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const cashGiven = watch("cashGiven") ?? 0;
  const [scanBuffer, setScanBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [formError, setFormError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSaleDateDisplay(dayjs(now).format("DD-MM-YYYY"));
    setSaleDateLocal(dayjs(now).format("YYYY-MM-DDTHH:mm:ss"));
  }, []);

  useEffect(() => {
    if (!products.length) return;
    const subscription = watch((value) => {
      const dets = value?.details ?? [];
      let total = 0;
      for (const d of dets) {
        if (!d) continue;
        const prod = products.find((p) => p.id === Number(d.productId));
        if (prod) {
          let precioUnitarioBase = Number(prod.salePrice ?? 0);
          if (d.extras && d.extras.length > 0) {
            for (const ex of d.extras) {
              if(ex!=null || ex!=undefined){
                  const prodExtra = products.find((p) => p.id === Number(ex.productId));
                  if (prodExtra) {
                    precioUnitarioBase += Number(prodExtra.salePrice ?? 0);
                  }
              }
            }
          }
          total += precioUnitarioBase * Number(d.quantity ?? 0);
        }
      }
      setTotalVenta(Number(total.toFixed(2)));
    });
    return () => subscription.unsubscribe();
  }, [products, watch]);

  useEffect(() => {
    if (!products || !searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }
    const list = products;
    const term = searchTerm.toLowerCase();
    const results = list.filter((p) => {
      const nombre = (p.name || "").toLowerCase();
      if (nombre.includes("extra") || nombre.includes("base")) return false;
      return (
        nombre.includes(term) ||
        (p.codigoBarras?.toString() ?? "").includes(term) ||
        (p.barcode?.toString() ?? "").includes(term) ||
        (p.sku?.toLowerCase() ?? "").includes(term)
      );
    });
    setFilteredProducts(results);
  }, [searchTerm, products]);

  useEffect(() => {
    if (!isCash) {
      setValue("changeAmount", 0, { shouldValidate: false });
      return;
    }
    if (isNaN(cashGiven)) return;
    const nuevoCambio = cashGiven > totalVenta ? cashGiven - totalVenta : 0;
    setValue("changeAmount", nuevoCambio, { shouldValidate: false });
  }, [isCash, cashGiven, totalVenta, setValue]);

  const onSubmit = async (values: VentaForm) => {
    const method = paymentMethods?.find((m) => m.id === values.paymentMethodId);
    
    const pagoReal = Number(values.cashGiven ?? 0);
    if (pagoReal < 0) {
      toastError("El monto pagado no puede ser negativo.");
      return;
    }

    ventaFormSnapshot.current = values;
    for (const d of values.details) {
      const prod = products.find((p) => p.id === d.productId);
      if (!prod) continue;
      const qty = Number(d.quantity);
      const u = getUnidadUI(prod);

      if (u.esPieza) {
        if (!Number.isInteger(qty)) {
          toastError(`"${prod.name}" es por ${u.label}, la cantidad debe ser entera.`);
          return;
        }
        if (qty < u.min) {
          toastError(`Cantidad inválida en "${prod.name}". Mínimo: ${u.min} ${u.label}`);
          return;
        }
      } else {
        if (qty < u.min) {
          toastError(`Cantidad inválida en "${prod.name}". Mínimo: ${u.min} ${u.label}`);
          return;
        }
      }
    }

    const productosResumen = (values.details || []).map((d) => {
      const prod = products.find((p) => p.id === Number(d.productId));
      const u = prod ? getUnidadUI(prod) : null;
      let precioUnitarioConExtras = prod?.salePrice ?? 0;
      const nombresExtras: string[] = [];

      if (d.extras && d.extras.length > 0) {
        d.extras.forEach((ex) => {
          const ep = products.find((p) => p.id === Number(ex.productId));
          if (ep) {
            precioUnitarioConExtras += ep.salePrice ?? 0;
            nombresExtras.push(ep.name);
          }
        });
      }

      const nombreAmostrar = nombresExtras.length > 0
          ? `${prod?.name ?? "Producto"} (+ ${nombresExtras.join(", ")})`
          : prod?.name ?? "Producto";

      return {
        name: nombreAmostrar,
        quantity: Number(d.quantity) || 0,
        price: precioUnitarioConExtras,
        unitAbbr: prod?.unidadMedidaAbreviatura ?? u?.label ?? null,
        unitName: prod?.unidadMedidaNombre ?? null,
      };
    });

    setResumenVenta({
      cliente: clients?.find((c) => c.id === values.clientId)?.name ?? "Sin cliente",
      metodoPago: method?.name ?? "",
      productos: productosResumen,
      total: totalVenta,
      pago: pagoReal,
      cambio: values.changeAmount ?? 0,
      sucursal: branches?.find((b) => b.id === selectedBranchId)?.name ?? "",
    });

    setShowResumenModal(true);
  };

  const confirmarVentaFinal = async () => {
    if (!ventaFormSnapshot.current) return;
    const v = ventaFormSnapshot.current;
    
    const pagoReal = Number(v.cashGiven ?? 0);
    const payload = {
      clientId: v.clientId === 0 ? null : v.clientId,
      clientName: v.clientId === 0 ? v.referenceName : null,
      paymentMethodId: v.paymentMethodId,
      saleDate: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      amountPaid: pagoReal,
      changeAmount: v.changeAmount ?? 0,
      branchId: selectedBranchId ?? userBranchId ?? 0,
      emailList: [],
      details: v.details.map((d) => ({
        productId: d.productId,
        quantity: d.quantity,
        extras: d.extras ?? [],
        notes: d.notes ?? "",
        ...(usaInventarioPorDuenio ? { ownerType: d.ownerType ?? "PROPIO" } : {}),
      })),
    };

    try {
      const ventaCreada = await mutateAsync(payload);
      setVentaIdCreada(ventaCreada.id);
      setShowResumenModal(false);
      setShowSendEmailModal(true);
      resetAll();
      onCreated();
    } catch (error: unknown) {
      const err = error as BackendError;
      const message =
        err?.response?.data?.message ??
        "Error inesperado al generar la venta";
        toastError(message);
    }
  };

  const resetAll = useCallback(() => {
    reset({
      clientId: 0,
      paymentMethodId: 0,
      referenceName: "",  
      cashGiven: 0,
      amountPaid: 0,
      changeAmount: 0,
      emailList: [],
      details: [],
    });
    setSelectedBranchId(isSuper ? null : userBranchId);
    setSearchTerm("");
    setFilteredProducts([]);
    setIsCash(false);
    setLocalCash("");
    setTotalVenta(0);
  }, [reset, isSuper, userBranchId]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setFormError("⚠️ Revisa los campos obligatorios.");
    } else {
      setFormError("");
    }
  }, [errors]);

  useEffect(() => {
    setActiveProductIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    if (filteredProducts.length === 0) {
      setActiveProductIndex(0);
      return;
    }
    setActiveProductIndex((prev) =>
      prev > filteredProducts.length - 1 ? 0 : prev
    );
  }, [filteredProducts.length]);


  /* ---------- Render ---------- */
  return (
    <div className="flex flex-col h-full bg-white relative shadow-md">
      
      {/* Header del Panel */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-slate-800">
          Registrar nueva venta
        </h2>
        <div className="flex items-center gap-2">
          <Label className="text-[11px] text-gray-500 font-medium">Fecha:</Label>
          <Input
            type="text"
            value={saleDateDisplay}
            disabled
            className="w-24 h-7 text-center text-xs border rounded bg-gray-200 text-gray-600 cursor-default"
          />
        </div>
      </div>

      {/* Cuerpo scrolleable del formulario */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <form 
          onSubmit={handleSubmit(
            onSubmit,
            () => setFormError("⚠️ Revisa los campos obligatorios.")
          )}
          className="flex flex-col gap-5 w-full pb-6"
        >  
          {formError && (
              <div className="text-red-600 text-sm text-left font-medium">
                {formError}
              </div>
          )}

          {isSuper && (
              <div className="flex flex-col gap-1 w-full">
                <Label>Sucursal</Label>
                <select
                  className="border rounded px-2 py-2 w-full text-sm"
                  value={selectedBranchId ?? 0}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedBranchId(id);
                    setValue("details", []);
                    setFilteredProducts([]);
                    setExtraProducts([]);
                    trigger("details");
                  }}
                >
                  <option value="0">Seleccione sucursal</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
          )}

          <div className="relative">
            <Label>Buscar producto</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Escribe o escanea el código..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  const now = Date.now();
                  if (now - lastKeyTime < 200) {
                    setScanBuffer((prev) => prev + value.slice(-1));
                  } else {
                    setScanBuffer(value.slice(-1));
                  }
                  setLastKeyTime(now);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "ArrowDown" && filteredProducts.length > 0) {
                    e.preventDefault();
                    setActiveProductIndex((prev) =>
                      prev >= filteredProducts.length - 1 ? 0 : prev + 1
                    );
                    return;
                  }
                  if (e.key === "ArrowUp" && filteredProducts.length > 0) {
                    e.preventDefault();
                    setActiveProductIndex((prev) =>
                      prev <= 0 ? filteredProducts.length - 1 : prev - 1
                    );
                    return;
                  }
                  if (e.key === "Enter" && filteredProducts.length > 0) {
                    e.preventDefault();
                    const selected = filteredProducts[activeProductIndex] ?? filteredProducts[0];
                    if (selected) {
                      await selectProductFromSearch(selected);
                    }
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setSearchTerm("");
                    setFilteredProducts([]);
                    setActiveProductIndex(0);
                    return;
                  }
                  if (e.key === "Enter" && scanBuffer.length >= 6) {
                    e.preventDefault();
                    handleBarcodeScan(scanBuffer.trim());
                    setScanBuffer("");
                    setSearchTerm("");
                  }
                }}
                className="w-full"
              />

              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition"
              >
                📷
              </button>
            </div>

            {/* Dropdown de resultados */}
            {filteredProducts.length > 0 && (
              <div className="absolute z-20 bg-white border rounded shadow-lg w-full mt-1 max-h-56 overflow-y-auto">
                {filteredProducts.map((p, index) => {
                  const isActive = index === activeProductIndex;
                  const lowerName = (p.name || "").toLowerCase();
                  const isVerde = lowerName.includes("verde");
                  const isRojo = lowerName.includes("rojo");
                  
                  let itemClass = "";
                  let subTextClass = "";

                  if (isActive) {
                    itemClass = isVerde ? "bg-green-600 text-white" : isRojo ? "bg-red-600 text-white" : "bg-blue-600 text-white";
                    subTextClass = "text-white/80";
                  } else {
                    itemClass = isVerde ? "bg-green-100 text-green-900 hover:bg-green-200" : isRojo ? "bg-red-100 text-red-900 hover:bg-red-200" : "bg-white text-slate-900 hover:bg-blue-50";
                    subTextClass = isVerde ? "text-green-700" : isRojo ? "text-red-700" : "text-slate-500";
                  }

                  return (
                    <div
                      key={p.id}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveProductIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectProductFromSearch(p);
                      }}
                      className={`cursor-pointer px-3 py-3 border-b last:border-b-0 transition ${itemClass}`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className={`text-xs ${subTextClass}`}>
                        SKU: {p.sku} – ${p.salePrice?.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {errors.details && (
            <p className="text-red-600 text-sm">
              {errors.details.message as string}
            </p>
          )}

          {/* Lista de Productos Agregados */}
          <div className="border-t pt-3 space-y-3">
            {fields.length === 0 ? (
                <div className="text-gray-500 text-sm italic py-4 text-center bg-gray-50 rounded-lg border border-dashed">
                  Agrega productos para comenzar la venta.
                </div>
              ) : (
                <>
                  {fields.map((f, i) => {
                      const prod = products.find((p) => p.id === f.productId);
                      if (!prod) return null;
                      let precioMostrar = Number(prod.salePrice ?? 0);
                      const extrasDeEstePlatillo = details[i]?.extras || [];
                      extrasDeEstePlatillo.forEach((ex) => {
                        const pEx = products.find((px) => px.id === ex.productId);
                        if (pEx) precioMostrar += Number(pEx.salePrice ?? 0);
                      });

                      const lowerName = (prod.name || "").toLowerCase();
                      const isVerde = lowerName.includes("verde");
                      const isRojo = lowerName.includes("rojo");
                      const rowBgClass = isVerde ? "bg-green-50 border-green-200" : isRojo ? "bg-red-50 border-red-200" : "border-slate-200";
                      const titleClass = isVerde ? "text-green-900" : isRojo ? "text-red-900" : "text-slate-800";
                      const u = getUnidadUI(prod);

                      return (
                        <div key={f.id} className={`flex flex-col gap-2 border rounded-lg p-3 ${rowBgClass} relative`}>
                          
                          {/* Botón de eliminar esquina superior derecha */}
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition p-1"
                            onClick={() => remove(i)}
                            title="Eliminar producto"
                          >
                            ✕
                          </button>

                          <span className={`font-bold text-sm pr-6 ${titleClass}`}>
                            {prod.name}
                          </span>

                          <div className="flex items-center justify-between mt-1">
                            {/* Input cantidad */}
                            <div className="flex items-center gap-1 w-24">
                                <Input
                                  type="number"
                                  data-no-wheel="true"
                                  min={u.min}
                                  step={u.step}
                                  className="h-8 text-sm"
                                  {...register(`details.${i}.quantity`, {
                                    valueAsNumber: true,
                                    onChange: async (e) => {
                                      const raw = (e.target as HTMLInputElement).value;
                                      const n = raw === "" ? 0 : Number(raw);
                                      setValue(`details.${i}.quantity`, n, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      });
                                      await trigger("details");
                                    },
                                  })}
                                />
                            </div>
                            {/* Precio acumulado de este item */}
                            <div className="font-semibold text-slate-800 text-right">
                              ${precioMostrar.toFixed(2)}
                            </div>
                          </div>

                          {/* Render Extras */}
                          {extrasDeEstePlatillo.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                              {extrasDeEstePlatillo.map((ex, exIdx) => {
                                const prodExtra = products.find((pEx) => pEx.id === ex.productId);
                                return (
                                  <div key={exIdx} className="flex items-center justify-between text-xs bg-blue-50/70 p-1.5 rounded border border-blue-100">
                                    <span className="truncate font-medium text-blue-900">+ {prodExtra?.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-green-700">${prodExtra?.salePrice?.toFixed(2)}</span>
                                      <button
                                        type="button"
                                        className="text-red-500 font-bold px-1"
                                        onClick={() => {
                                          const nuevosExtras = [...extrasDeEstePlatillo];
                                          nuevosExtras.splice(exIdx, 1);
                                          setValue(`details.${i}.extras`, nuevosExtras, { shouldValidate: true });
                                        }}
                                      >✕</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Select de extras */}
                          <select
                            className="text-xs font-medium border border-slate-200 rounded p-1.5 w-full bg-white outline-none mt-1"
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val > 0) {
                                setValue(
                                  `details.${i}.extras`,
                                  [...extrasDeEstePlatillo, { productId: val }],
                                  { shouldValidate: true }
                                );
                                e.target.value = "0";
                              }
                            }}
                            defaultValue="0"
                          >
                            <option value="0">➕ Añadir extra...</option>
                            {products
                              .filter((p) => {
                                const nombre = (p.name || "").toLowerCase();
                                return nombre.includes("extra") || nombre.includes("base");
                              })
                              .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                              .map((p) => {
                                const isBase = (p.name || "").toLowerCase().includes("base");
                                return (
                                  <option 
                                    key={p.id} 
                                    value={p.id}
                                    className={isBase ? "text-blue-700 font-bold bg-blue-50" : "text-slate-700"}
                                  >
                                    {isBase ? "🔹 " : ""}{p.name} (+${p.salePrice?.toFixed(2)})
                                  </option>
                                );
                              })}
                          </select>
                          
                                                    {/* Notas */}
                          <Input
                            type="text"
                            placeholder="Notas a cocina (ej. Sin cebolla)"
                            className="h-8 text-xs italic bg-white/70 mt-1"
                            {...register(`details.${i}.notes`)}
                          />
                        </div>
                      );
                  })}
                </>
              )}
          </div>

         <div className="mt-2 flex flex-col gap-2">
            <Label>Cliente</Label>
            <select 
              {...register("clientId", { valueAsNumber: true })} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setValue("clientId", val, { shouldValidate: true });
                if (val !== 0) {
                  setValue("referenceName", "");
                }
                trigger();
              }}
              className="border rounded px-2 py-2 w-full text-sm"
            >
              <option value={0}>Selecciona un cliente</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {watch("clientId") === 0 && (
              <Input
                type="text"
                placeholder="Nombre para la orden (Ej. Juan)"
                className="h-9 text-sm bg-slate-50 border-dashed border-slate-300"
                {...register("referenceName")}
              />
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Label>Método de pago</Label>
           <select
              {...register("paymentMethodId", { valueAsNumber: true })}
              onChange={(e) => {
                const id = Number(e.target.value);
                setValue("paymentMethodId", id);
                trigger();
                const selected = paymentMethods?.find((m) => m.id === id);
                const isNowCash = selected?.name?.toUpperCase() === "EFECTIVO";
                setIsCash(isNowCash);
                
                if (!isNowCash) {
                  setValue("changeAmount", 0);
                }
              }}
              className="border rounded px-2 py-2 w-full text-sm"
            >
              <option value={0}>Seleccione método</option>
              {paymentMethods?.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {errors.paymentMethodId && (
              <p className="text-red-600 text-xs">{errors.paymentMethodId.message}</p>
            )}
          </div>

          <label className="flex flex-col gap-1 w-full">
            <span className="text-sm font-medium">
              {isCash ? "Monto recibido ($)" : "Monto a cobrar / abonar ($)"}
            </span>
            <Input
              type="number"
              data-no-wheel="true"
              step="0.01"
              min="0"
              className={`border rounded px-3 py-2 text-left ${
                Number(localCash) < totalVenta && localCash !== ""
                ? "border-yellow-500 bg-yellow-50"
                : ""
              }`}
              value={localCash}
              onChange={(e) => {
                const val = e.target.value;
                setLocalCash(val);
                const num = parseFloat(val);
                if (!isNaN(num)) {
                  setValue("cashGiven", num, { shouldValidate: false, shouldDirty: true });
                }
              }}
              onBlur={() => {
                if (localCash === "" || isNaN(Number(localCash))) {
                  setLocalCash("0");
                  setValue("cashGiven", 0, { shouldValidate: false });
                }
              }}
            />
            {localCash !== "" && Number(localCash) < totalVenta && (
              <p className="text-yellow-600 text-xs mt-1">⚠️ El pago es menor al total (Venta PARCIAL / PENDIENTE).</p>
            )}
            {!isCash && localCash !== "" && Number(localCash) > totalVenta && (
              <p className="text-red-600 text-xs mt-1">⚠️ No se da cambio físico en métodos electrónicos.</p>
            )}
          </label>

        </form>
      </div>

      {/* Footer pegajoso en la parte inferior del panel */}
      <div className="border-t bg-slate-50 p-4 mt-auto">
        <div className="flex justify-between items-end mb-4">
            <div>
              {isCash && watch("changeAmount") !== undefined && watch("changeAmount")! > 0 && (
                <div className="text-sm text-gray-600">
                  Cambio: <span className="font-bold text-green-700">${watch("changeAmount")?.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold mb-1">TOTAL VENTA</div>
              <div className="text-2xl font-bold text-slate-900">
                {products ? `$${totalVenta.toFixed(2)}` : "$0.00"}
              </div>
            </div>
        </div>

        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isPending || fields.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold shadow-md transition"
        >
          {isPending ? "Generando..." : "GENERAR COMANDA"}
        </Button>
      </div>

      {/* Modales */}
      <ConfirmarVentaModal
        open={showResumenModal}
        onClose={() => setShowResumenModal(false)}
        onConfirm={confirmarVentaFinal}
        resumen={resumenVenta}
        isLoading={isConfirming}
      />
      <EnviarTicketModal
        ventaId={ventaIdCreada}
        open={showSendEmailModal}
        onClose={() => setShowSendEmailModal(false)}
      />
      
      {showScanner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[20000] flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-[95%] max-w-md shadow-xl relative">
            <h2 className="text-xl font-semibold mb-3 text-center">Escanear código</h2>
            <BarcodeCameraScanner
              onResult={(code) => {
                setShowScanner(false);
                handleBarcodeScan(code); 
              }}
              onError={(e) => console.error("Error escáner:", e)}
            />
            <button
              onClick={() => setShowScanner(false)}
              className="mt-4 w-full bg-red-600 text-white py-2 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
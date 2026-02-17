"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { z, ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import {ResumenVenta} from "@/types/catalogs";
import { toastError } from "@/lib/toast";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";
import { useDisableNumberWheel } from "@/hooks/useDisableNumberWheel";



import dayjs from "dayjs";
import "dayjs/locale/es";

/* ---------- Schema ---------- */
const schema = z.object({
  clientId: z.coerce.number().int().positive("Seleccione cliente"),
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

  // ✅ Detectar metro por código
  const esMetro = code === "METRO" || code === "M";

  // ✅ Pieza: por tu regla actual (si NO permite decimales)
  const esPieza = p.permiteDecimales === false;

  const label =
    abbr ||
    (code ? code.toLowerCase() : "") ||
    (esPieza ? "pz" : esMetro ? "m" : "kg");

  // ✅ Tu cambio: metro 0.1, otros decimales 0.01
  const step = esPieza ? 1 : esMetro ? 0.1 : 0.01;
  const min = esPieza ? 1 : esMetro ? 0.1 : 0.01;

  return { label, step, min, esPieza, esMetro };
};


const makeZodResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;


/* ---------- Componente ---------- */
export default function AddVentaButton({ onCreated }: { onCreated: () => void }) {
  const { mutateAsync, isPending } = useCreateVenta();
    useDisableNumberWheel();
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");
  const userBranchId = auth.user?.branchId ?? null;

  const [open, setOpen] = useState(false);
  const [isCash, setIsCash] = useState(false);
  const [localCash, setLocalCash] = useState("");
  const [saleDateDisplay, setSaleDateDisplay] = useState("");
  const [saleDateLocal, setSaleDateLocal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
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

  const branches = useMemo(
    () => branchesHook.data ?? [],
    [branchesHook.data]
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId),
    [branches, selectedBranchId]
  );

  const usaInventarioPorDuenio =
    selectedBranch?.usaInventarioPorDuenio === true;
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
      paymentMethodId: 0,
      cashGiven: 0,
      amountPaid: 0,
      changeAmount: 0,
      emailList: [],
      details: [],
    },
  });




  const { fields, remove, append } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const cashGiven = watch("cashGiven") ?? 0;
  const [scanBuffer, setScanBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [formError, setFormError] = useState("");

const [showScanner, setShowScanner] = useState(false);


  /* ---------- Fecha automática ---------- */
  useEffect(() => {
    const now = new Date();
    setSaleDateDisplay(dayjs(now).format("DD-MM-YYYY"));
    setSaleDateLocal(dayjs(now).format("YYYY-MM-DDTHH:mm:ss"));
  }, []);


  /* ---------- Calcular total ---------- */
useEffect(() => {
  if (!products.length) return;

  const subscription = watch((value) => {
    const dets = value?.details ?? [];
    let total = 0;

    for (const d of dets) {

      if (!d) continue; // 🛑 Evita el warning y asegura que d no sea undefined

      const prod = products.find(p => p.id === Number(d.productId));

      if (prod) {
        total += Number(prod.salePrice ?? 0) * Number(d.quantity ?? 0);
      }
    }

    setTotalVenta(Number(total.toFixed(2)));
  });

  return () => subscription.unsubscribe();
}, [products, watch]);

  /* ---------- Búsqueda por nombre o código ---------- */
  useEffect(() => {
    if (!products || !searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    const list = products;
    
    const term = searchTerm.toLowerCase();

    const results = list.filter(
      (p) =>
        (p.name?.toLowerCase() ?? "").includes(term) ||
        (p.codigoBarras?.toString() ?? "").includes(term) ||
        (p.barcode?.toString() ?? "").includes(term) ||
        (p.sku?.toLowerCase() ?? "").includes(term)
    );

    setFilteredProducts(results);
  }, [searchTerm, products]);

  /* ---------- Calcular cambio si es efectivo ---------- */
  useEffect(() => {
    if (!isCash) return;
    if (isNaN(cashGiven)) return;
    const nuevoCambio = cashGiven > totalVenta ? cashGiven - totalVenta : 0;
    setValue("changeAmount", nuevoCambio, { shouldValidate: false });
  }, [isCash, cashGiven, totalVenta, setValue]);

  /* ---------- Envío ---------- */
const onSubmit = async (values: VentaForm) => {
  const method = paymentMethods?.find((m) => m.id === values.paymentMethodId);

  const isCashMethod = method?.name?.toUpperCase() === "EFECTIVO";
  const pagoReal = isCashMethod ? values.cashGiven ?? 0 : totalVenta;

  if (isCashMethod && pagoReal < totalVenta) {
    toastError("El monto pagado es insuficiente.");
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

  return {
    name: prod?.name ?? "Producto",
    quantity: Number(d.quantity) || 0,
    price: prod?.salePrice ?? 0,
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

const handleBarcodeScan = async (code: string) => {
  const cleanCode = code.trim();

  let list: ProductItem[] = products;
  let prod: ProductItem | null = null;
  prod =
    list.find(
      (p) =>
        p.codigoBarras?.toString().trim() === cleanCode ||
        p.barcode?.toString().trim() === cleanCode
    ) ?? null;

  if (!prod) {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_URL}/productos/barcode/${cleanCode}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!resp.ok) {
        console.warn("Código no encontrado en backend:", cleanCode);
        return;
      }

      const data = (await resp.json()) as ProductItem;

      if (!data?.id) {
        console.warn("Backend devolvió un producto inválido:", data);
        return;
      }

      prod = data;
      setExtraProducts((prev) =>
        prev.some((x) => x.id === data.id) ? prev : [...prev, data]
      );
      list = [...list, data];

    } catch (error) {
      console.error("Error consultando backend:", error);
      return;
    }
  }

  if (!prod) return;

  const exists = details.find((d) => d.productId === prod!.id);

  if (exists) {
    const newDetails = details.map((d) =>
      d.productId === prod!.id
        ? { ...d, quantity: (d.quantity ?? 0) + 1 }
        : d
    );

    setValue("details", newDetails, { shouldValidate: true });
  } else {
     append({ productId: prod.id, quantity: 1 });
    await trigger("details");
    }

  await trigger("details");

  // 5️⃣ Limpieza
  setFilteredProducts([]);
  setSearchTerm("");
  setScanBuffer("");
};



const confirmarVentaFinal = async () => {
  if (!ventaFormSnapshot.current) return; // ⬅ Datos listos

  const v = ventaFormSnapshot.current;

  const method = paymentMethods?.find((m) => m.id === v.paymentMethodId);
  const isCashMethod = method?.name?.toUpperCase() === "EFECTIVO";
  const pagoReal = isCashMethod ? v.cashGiven ?? 0 : totalVenta;

  const payload = {
    clientId: v.clientId,
    paymentMethodId: v.paymentMethodId,
    saleDate: saleDateLocal,
    amountPaid: pagoReal,
    changeAmount: v.changeAmount ?? 0,
    branchId: selectedBranchId ?? userBranchId ?? 0,
    emailList: [],
    details: v.details.map((d) => ({
      productId: d.productId,
      quantity: d.quantity,
      ...(usaInventarioPorDuenio ? { ownerType: d.ownerType ?? "PROPIO" } : {}),
    })),
  };

  try {
    const ventaCreada = await mutateAsync(payload);
    setVentaIdCreada(ventaCreada.id);
    setShowResumenModal(false);
    setShowSendEmailModal(true);
    resetAll();
    setOpen(false);
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
  if (!open) {
    resetAll();
  }
}, [open, resetAll]);

useEffect(() => {
  if (Object.keys(errors).length > 0) {
    setFormError("⚠️ Revisa los campos obligatorios.");
  } else {
    setFormError("");
  }
}, [errors]);
  /* ---------- Render ---------- */
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Nueva venta
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-[90vw] md:max-w-5xl w-full">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-lg font-semibold">
                Registrar nueva venta
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Label className="text-[11px] text-gray-500 font-medium">Fecha:</Label>
                <Input
                  type="text"
                  value={saleDateDisplay}
                  disabled
                  className="w-24 h-7 text-center text-xs border rounded bg-gray-100 text-gray-500 cursor-default"
                />
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <form  onSubmit={handleSubmit(
                onSubmit,
                () => setFormError("⚠️ Revisa los campos obligatorios.")
              )}
                className="flex flex-col gap-5 mt-4 w-full">  
              {/* Campo de búsqueda unificado */}
                {formError && (
                    <div className="text-red-600 text-sm mt-2 text-left">
                      {formError}
                    </div>
                  )}

                  {isSuper && (
                      <div className="flex flex-col gap-1 w-64">
                        <Label>Sucursal</Label>
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={selectedBranchId ?? 0}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            setSelectedBranchId(id);
                            // limpiar productos seleccionados
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

                          // --- Buffer para escáner físico ---
                          const now = Date.now();
                          if (now - lastKeyTime < 200) {
                            setScanBuffer((prev) => prev + value.slice(-1));
                          } else {
                            setScanBuffer(value.slice(-1));
                          }
                          setLastKeyTime(now);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && scanBuffer.length >= 6) {
                            handleBarcodeScan(scanBuffer.trim());
                            setScanBuffer("");
                            setSearchTerm("");
                          }
                        }}
                        className="w-full"
                      />

                      {/* 📷 botón de cámara */}
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg shadow"
                      >
                        📷
                      </button>
                    </div>

                    {/* dropdown de resultados */}
                    {filteredProducts.length > 0 && (
                      <div className="absolute z-20 bg-white border rounded shadow-md w-full mt-1 max-h-56 overflow-y-auto">
                        {filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                              const exists = details.find((d) => d.productId === p.id);

                              if (exists) {
                                setValue(
                                  "details",
                                  details.map((d) =>
                                    d.productId === p.id
                                      ? { ...d, quantity: (d.quantity ?? 0) + 1 }
                                      : d
                                  )
                                );
                              } else {
                             append({
                                productId: p.id,
                                quantity: 1,
                                ...(usaInventarioPorDuenio ? { ownerType: "PROPIO" } : {}),
                              });
                              }

                              trigger("details");

                              setSearchTerm("");
                              setFilteredProducts([]);
                            }}
                          >
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">
                              C.Barras: {p.codigoBarras ?? "N/A"} — SKU: {p.sku} – $
                              {p.salePrice?.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              {errors.details && (
                <p className="text-red-600 text-sm">
                  {errors.details.message as string}
                </p>
              )}
              {/* Productos */}
              <div className="border-t pt-3 space-y-2">
                {fields.length === 0 ? (
                    <div className="text-gray-500 text-sm italic py-2">
                      Aquí aparecerán los productos de la venta cuando selecciones uno desde el buscador.
                    </div>
                  ) : (
                    <>
                      <div
                        className={`
                          hidden md:grid
                          ${usaInventarioPorDuenio ? "md:grid-cols-5" : "md:grid-cols-4"}
                          gap-2 items-center
                          font-semibold text-sm text-gray-700 border-b pb-2
                        `}
                      >
                        <div>Producto</div>
                        {usaInventarioPorDuenio && <div>Tipo</div>}
                        <div>Cantidad</div>
                        <div className="text-center">Precio</div>
                        <div className="text-center">Acción</div>
                      </div>
                      {fields.map((f, i) => {
                        const prod = products.find((p) => p.id === f.productId);
                        if (!prod) return null;

                        return (
                          <div
                            key={f.id}
                            className={`
                              grid gap-3
                              md:gap-2
                              ${usaInventarioPorDuenio ? "md:grid-cols-5" : "md:grid-cols-4"}
                              border rounded-lg p-3 md:p-0 md:border-0
                            `}
                          >
                            {/* Producto */}
                            <div className="font-medium text-sm md:text-base">
                              {prod.name}
                            </div>

                            {/* Tipo */}
                            {usaInventarioPorDuenio && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="accent-blue-600"
                                  checked={(details[i]?.ownerType ?? "PROPIO") === "CONSIGNACION"}
                                  onChange={(e) =>
                                    setValue(
                                      `details.${i}.ownerType`,
                                      e.target.checked ? "CONSIGNACION" : "PROPIO",
                                      { shouldValidate: true }
                                    )
                                  }
                                />
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                                    ${
                                      (details[i]?.ownerType ?? "PROPIO") === "PROPIO"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                  {(details[i]?.ownerType ?? "PROPIO")}
                                </span>
                              </div>
                            )}

                            {/* Cantidad */}
                            {(() => {
                              const u = getUnidadUI(prod);

                              return (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    data-no-wheel="true"
                                    min={u.min}
                                    step={u.step}
                                    className="w-full md:w-24"
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
                                  <span className="text-xs text-gray-600 min-w-[24px] text-left">
                                    {u.label}
                                  </span>
                                </div>
                              );
                            })()}
                            {/* Precio */}
                            <div className="text-sm md:text-center font-medium">
                              ${prod.salePrice?.toFixed(2)}
                            </div>

                            {/* Acción */}
                            <Button
                              type="button"
                              variant="outline"
                              className="text-red-500 border-red-400 w-full md:w-auto"
                              onClick={() => remove(i)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        );
                      })}
                    </>
                  )}
              </div>
              {/* Cliente */}
              <Label>Cliente</Label>
                <select {...register("clientId", { valueAsNumber: true })} 
                onChange={(e) => {
                  setValue("clientId", Number(e.target.value), { shouldValidate: true });
                  trigger();
                }}
                  className="border rounded px-2 py-1 w-full">
                  <option value={0}>Seleccione cliente</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              {/* Total y pago */}
              <div className="flex flex-col items-end gap-2 mt-4 border-t pt-3">
                <div className="text-lg font-semibold">
                  TOTAL DE LA VENTA: {products ? `$${totalVenta.toFixed(2)}` : "..."}
                </div>
                    {/* Método de pago */}
              <div  className="flex justify-end">
                <div  className="w-64">
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
                      setLocalCash("");
                      setValue("cashGiven", 0);
                      setValue("changeAmount", 0);
                    }
                  }}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value={0}>Seleccione método</option>
                  {paymentMethods?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {errors.paymentMethodId && (
                  <p className="text-red-600 text-sm">{errors.paymentMethodId.message}</p>
                )}
                </div>
              </div>
                {isCash && (
                  <div className="flex flex-col items-end gap-1 w-64">

                    <label className="flex flex-col gap-1 w-full">
                      <span className="text-sm text-right">Cantidad pagada ($)</span>
                      <Input
                        type="number"
                        data-no-wheel="true"
                        step="0.01"
                        className={`border rounded px-3 py-2 text-right ${
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
                            setValue("cashGiven", num, {
                              shouldValidate: false,
                              shouldDirty: true,
                            });
                          }
                        }}
                        onBlur={() => {
                          if (localCash === "" || isNaN(Number(localCash))) {
                            setLocalCash("0");
                            setValue("cashGiven", 0, { shouldValidate: false });
                          }
                        }}
                      />
                    </label>

                    {/* Advertencia */}
                    {Number(localCash) < totalVenta && localCash !== "" && (
                      <p className="text-yellow-700 text-sm text-right font-medium">
                        ⚠️ Debe pagar la cantidad exacta o superior (${totalVenta.toFixed(2)})
                      </p>
                    )}

                    <div className="text-sm">
                      <strong>Cambio:</strong>{" "}
                      {new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(watch("changeAmount") ?? 0)}
                    </div>
                  </div>
                )}
              </div>
            
              {/* Botones */}
              <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="submit"
                disabled={
                  isPending ||
                  (isCash && Number(localCash) < totalVenta)
                }
                className={`bg-blue-600 text-white ${
                  isCash && Number(localCash) < totalVenta
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                {isPending
                  ? "Guardando…"
                  : isCash && Number(localCash) < totalVenta
                  ? "Pago insuficiente"
                  : "Guardar venta"}
              </Button>
                <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
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

              <h2 className="text-xl font-semibold mb-3 text-center">
                Escanear código de barras
              </h2>
              <BarcodeCameraScanner
                onResult={(code) => {
                  setShowScanner(false);
                  handleBarcodeScan(code); // ⬅ se integra directo con ventas
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
    </>
);
  
}

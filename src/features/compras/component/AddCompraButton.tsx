import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm, Resolver } from "react-hook-form";
import { z, ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCompra } from "@/hooks/useCompras";
import {
  useProviders,
  usePaymentMethods,
  useBranches,
  CatalogItem,
} from "@/hooks/useCatalogs";
import { useProductsByBranch, ProductsByBranchResponse } from "@/hooks/useProductsByBranch";
import { useAuth } from "@/hooks/useAuth";
import type { CompraCreate } from "@/features/compras/api";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { toastError } from "@/lib/toast";
import { ResumenCompra } from "@/types/catalogs";
import ConfirmarCompraModal from "@/features/compras/component/ConfirmarCompraModal";
import EnviarTicketCompraModal from "@/features/compras/component/EnviarTicketCompraModal";
import { ProductItem } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/FormSelect";

/* ---------- Schema ---------- */
const schema = z.object({
  providerId: z.number().min(1, "Selecciona un proveedor"),
  branchId: z.number().min(1, "Selecciona una sucursal"),
  paymentMethodId: z.number().min(1, "Selecciona un método de pago"),
  barcode: z.string().optional(),
  cashGiven: z.number().nonnegative().optional(),
  amountPaid: z.number().nonnegative().optional(),
  changeAmount: z.number().nonnegative().optional(),
  amountInWords: z.string().optional(),
  details: z
    .array(
      z.object({
        productId: z.number().min(1, "Selecciona un producto válido"),
        quantity: z.number().min(1, "Cantidad inválida"),
      })
    )
    .min(1, "Agrega al menos un producto válido"),
});

const makeZodResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

/* ---------- Toast ---------- */
function Toast({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error"; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;
  const color = toast.type === "success" ? "bg-green-600" : "bg-red-600";
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[11000]">
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div
          className={`${color} text-white shadow-xl rounded-lg px-4 py-3 max-w-sm flex gap-3`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded px-2 hover:bg-white/15"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

type CompraForm = z.infer<typeof schema>;
type ToastState = { type: "success" | "error"; message: string } | null;


/* ---------- Componente principal ---------- */
export default function AddCompraButton({ onCreated }: { onCreated?: () => void }) {
  const { mutateAsync, isPending } = useCreateCompra();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userBranchId = user?.branchId ?? null;

  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [isCash, setIsCash] = useState(false);
  const [localCash, setLocalCash] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(
    isSuperAdmin ? null : userBranchId
  );

  const [fechaCompraDisplay, setFechaCompraDisplay] = useState("");
  const [fechaCompraLocal, setFechaCompraLocal] = useState("");

  const branches = useBranches({
    isSuper: isSuperAdmin,
    businessTypeId: isSuperAdmin
      ? undefined
      : (user?.businessType ?? null),
    oneBranchId: isSuperAdmin
      ? null
      : (user?.branchId ?? null),
  });
  const providers = useProviders({});
  const paymentMethods = usePaymentMethods();
  const { data: products, isLoading, error } = useProductsByBranch(
    selectedBranchId ?? undefined
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CompraForm>({
    resolver: makeZodResolver(schema),
    defaultValues: {
      providerId: 0,
      branchId: 0,
      paymentMethodId: 0,
      barcode: "",
      cashGiven: 0,
      amountPaid: 0,
      changeAmount: 0,
      amountInWords: "",
      details: [],
    },
  });

  const details = watch("details");
  const cashGiven = watch("cashGiven") ?? 0;
  const barcode = watch("barcode");

  const [totalCompra, setTotalCompra] = useState<number>(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [compraIdCreada, setCompraIdCreada] = useState<number | null>(null);
  const [resumenCompra, setResumenCompra] = useState<ResumenCompra | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const compraFormSnapshot = useRef<CompraForm | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [scanBuffer, setScanBuffer] = useState<string>("");
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);

const normalizeProducts = (
  products: ProductsByBranchResponse | undefined
): ProductItem[] => {
  if (!products) return [];

  if (Array.isArray(products)) {
    return products;              // ya es ProductItem[]
  }

  // PageResponse<ProductItem>
  if (Array.isArray(products.content)) {
    return products.content;
  }

  return [];
};

  /* ---------- Total ---------- */
  useEffect(() => {
    if (!products) return;
    const list = Array.isArray(products) ? products : products?.content ?? [];
    const subscription = watch((value) => {
      const dets = value?.details ?? [];
      const newTotal = dets.reduce((acc: number, d) => {
        if (!d) return acc;
        const product = list.find((p) => p.id === Number(d.productId));
        const price = product?.purchasePrice ?? 0;
        const quantity = Number(d.quantity) || 0;
        return acc + price * quantity;
      }, 0);
      setTotalCompra(Number(newTotal.toFixed(2)));
    });
    return () => subscription.unsubscribe();
  }, [products, watch]);

  /* ---------- Fecha ---------- */
  useEffect(() => {
    const now = new Date();
    setFechaCompraDisplay(dayjs(now).format("DD-MM-YYYY"));
    setFechaCompraLocal(dayjs(now).format("YYYY-MM-DDTHH:mm:ss"));
  }, []);

  /* ---------- Escaneo ---------- */
  useEffect(() => {
    if (!barcode || !products) return;
    const list = Array.isArray(products) ? products : products?.content ?? [];
    const found = list.find((p) => p.barcode?.toString() === barcode?.toString());
    if (found) {
      const exists = details.find((d) => d.productId === found.id);
      if (exists) {
        setValue(
          "details",
          details.map((d) =>
            d.productId === found.id
              ? { ...d, quantity: (Number(d.quantity) || 0) + 1 }
              : d
          )
        );
      } else {
        setValue("details", [...details, { productId: found.id, quantity: 1 }]);
      }
      setValue("barcode", "");
    }
  }, [barcode, products, details, setValue]);

  /* ---------- Cambio ---------- */
  useEffect(() => {
    if (!isCash) return;
    if (isNaN(cashGiven)) return;
    const nuevoCambio = cashGiven > totalCompra ? cashGiven - totalCompra : 0;
    setValue("changeAmount", nuevoCambio, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [isCash, cashGiven, totalCompra, setValue]);

useEffect(() => {
  if (!products || !searchTerm.trim()) {
    setFilteredProducts([]);
    return;
  }

  const list = normalizeProducts(products);
  const term = searchTerm.toLowerCase();

  const results = list.filter((p) =>
    p.name?.toLowerCase().includes(term) ||
    p.barcode?.toString().includes(term) ||
    p.codigoBarras?.toString().includes(term) ||
    p.sku?.toLowerCase().includes(term)
  );

  setFilteredProducts(results);
}, [searchTerm, products]);


  /* ---------- Utils ---------- */
  const numberToWordsES = (num: number): string =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    })
      .format(num)
      .replace("$", "")
      .trim();

  const removeDetail = (index: number) => {
    const updated = details.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setValue("details", []);
    } else {
      const clean = updated.filter((d, i, arr) => {
        const isLast = i === arr.length - 1;
        return !(isLast && (!d.productId || d.productId === 0));
      });
      setValue("details", clean);
    }
  };

  /* ---------- Submit (solo abre modal de confirmación) ---------- */
  const onSubmit = async (values: CompraForm) => {
    if (!values.providerId || values.providerId === 0) {
      setToast({ type: "error", message: "Selecciona un proveedor antes de continuar." });
      return;
    }

    if (!values.branchId || values.branchId === 0) {
      setToast({ type: "error", message: "Selecciona una sucursal antes de continuar." });
      return;
    }

    if (!values.details?.length || values.details.every((d) => !d.productId)) {
      setToast({ type: "error", message: "Agrega al menos un producto válido." });
      return;
    }

   if (isSuperAdmin && (!values.branchId || values.branchId === 0)) {
      setToast({ type: "error", message: "Selecciona una sucursal antes de guardar." });
      return;
    }

    const method = paymentMethods.data?.find((m) => m.id === values.paymentMethodId);
    const isCashMethod = method?.name?.toUpperCase() === "EFECTIVO";

    const lista = Array.isArray(products) ? products : products?.content ?? [];

    const totalCompraCalc = values.details.reduce((acc, d) => {
      const product = lista.find((p) => p.id === Number(d.productId));
      return acc + (product?.purchasePrice ?? 0) * (Number(d.quantity) || 0);
    }, 0);

    const pagoReal = isCashMethod ? values.cashGiven ?? 0 : totalCompraCalc;

    if (isCashMethod && pagoReal < totalCompraCalc) {
      setToast({
        type: "error",
        message: `El monto pagado ($${pagoReal.toFixed(
          2
        )}) es menor al total de la compra ($${totalCompraCalc.toFixed(2)}).`,
      });
      return;
    }

    // Guardamos snapshot para confirmarCompraFinal
    compraFormSnapshot.current = values;

    const productosResumen = values.details.map((d) => {
      const prod = lista.find((p) => p.id === d.productId);
      return {
        name: prod?.name ?? "Producto",
        quantity: d.quantity,
        price: prod?.purchasePrice ?? 0,
      };
    });

    const resumen: ResumenCompra = {
      proveedor: providers.data?.find((p) => p.id === values.providerId)?.name ?? "",
      sucursal: branches.data?.find((b) => b.id === selectedBranchId)?.name ?? "",
      metodoPago: method?.name ?? "",
      productos: productosResumen,
      total: totalCompraCalc,
      pago: pagoReal,
      cambio: values.changeAmount ?? 0,
    };

    setResumenCompra(resumen);
    setShowConfirmModal(true);
  };

  /* ---------- Confirmación final (manda al backend) ---------- */
  const confirmCompraFinal = async () => {
    if (!compraFormSnapshot.current) return;

    const v = compraFormSnapshot.current;

    const method = paymentMethods.data?.find((m) => m.id === v.paymentMethodId);
    const isCashMethod = method?.name?.toUpperCase() === "EFECTIVO";

    const lista = Array.isArray(products) ? products : products?.content ?? [];

    const totalCompraCalc = v.details.reduce((acc, d) => {
      const product = lista.find((p) => p.id === Number(d.productId));
      return acc + (product?.purchasePrice ?? 0) * (Number(d.quantity) || 0);
    }, 0);

    const pagoReal = isCashMethod ? v.cashGiven ?? 0 : totalCompraCalc;

    const payload: CompraCreate = {
      providerId: v.providerId,
      branchId: v.branchId,
      paymentMethodId: v.paymentMethodId,
      purchaseDate: fechaCompraLocal,
      amountPaid: pagoReal,
      changeAmount: v.changeAmount ?? 0,
      amountInWords: numberToWordsES(totalCompraCalc),
      emailList: [],
      isPrinted: false,
      details: v.details.map((d) => ({
        productId: d.productId,
        quantity: d.quantity,
      })),
    };

    try {
      const compraCreada = await mutateAsync(payload);
      setCompraIdCreada(compraCreada.id);
      setShowConfirmModal(false);
      setShowTicketModal(true);

      reset();
      setOpen(false);
      onCreated?.();
    } catch (e) {
      console.error(e);
      toastError("Error al registrar la compra.");
    }
  };

const handleBarcodeScan = async (code: string) => {
  const list = normalizeProducts(products);
  const prod = list.find(
    (p) =>
      p.barcode?.toString().trim() === code.trim() ||
      p.codigoBarras?.toString().trim() === code.trim()
  );

  if (!prod) {
    console.warn("Código no encontrado:", code);
    return;
  }

  const exists = details.find((d) => d.productId === prod.id);

  if (exists) {
    setValue(
      "details",
      details.map((d) =>
        d.productId === prod.id ? { ...d, quantity: d.quantity + 1 } : d
      ),
      { shouldValidate: true }
    );
  } else {
    setValue(
      "details",
      [...details, { productId: prod.id, quantity: 1 }],
      { shouldValidate: true }
    );
  }

  await trigger("details");
  setFilteredProducts([]);
  setSearchTerm("");
};

const resetearFormularioCompra = () => {
  reset({
    providerId: 0,
    branchId: isSuperAdmin ? 0 : (selectedBranchId ?? 0),
    paymentMethodId: 0,
    barcode: "",
    cashGiven: 0,
    amountPaid: 0,
    changeAmount: 0,
    amountInWords: "",
    details: [],
  });

  setSearchTerm("");
  setFilteredProducts([]);
  setLocalCash("");
  setIsCash(false);
  setSelectedBranchId(isSuperAdmin ? null : userBranchId);

  // actualizar fechas
  const now = new Date();
  setFechaCompraDisplay(dayjs(now).format("DD-MM-YYYY"));
  setFechaCompraLocal(dayjs(now).format("YYYY-MM-DDTHH:mm:ss"));
};

  const onClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  /* ---------- Warning general ---------- */
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [errors]);

  /* ---------- Render ---------- */
  return (
    <>
     <button
      className="px-3 py-2 rounded bg-blue-600 text-white"
      onClick={() => {
        resetearFormularioCompra();
        setOpen(true);
      }}
    >
      Nueva compra
    </button>

      <Toast toast={toast} onClose={() => setToast(null)} />



<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-[90vw] md:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <div className="flex items-center justify-between pr-4 w-full">
      <DialogTitle className="text-lg font-semibold">
        Registrar nueva compra
      </DialogTitle>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={fechaCompraDisplay}
          disabled
          className="w-28 h-7 text-center text-sm border rounded bg-gray-100 text-gray-700 cursor-default"
        />
      </div>
    </div>
  </DialogHeader>

    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >   
      {/* ⚠️ Alerta general de validación */}
      {showWarning && (
        <div className="text-red-600 text-sm text-left mb-2">
          ⚠️ Revisa los campos obligatorios antes de continuar.
        </div>
      )}
                {/* Búsqueda por nombre/código */}
              <div className="relative">
                <label className="text-sm font-medium">Buscar producto</label>

                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Escribe o escanea..."
                  className="border rounded px-3 py-2 w-full"
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);

                    // Detectar escáner
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
                      handleBarcodeScan(scanBuffer);
                      setScanBuffer("");
                      setSearchTerm("");
                    }
                  }}
                />
                {errors.details && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.details.message as string}
                  </p>
                )}

                {filteredProducts.length > 0 && (
                  <div className="absolute bg-white border rounded shadow-md w-full mt-1 max-h-56 overflow-y-auto z-20">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={async () => {
                            const exists = details.find((d) => d.productId === p.id);

                            if (exists) {
                              setValue(
                                "details",
                                details.map((d) =>
                                  d.productId === p.id ? { ...d, quantity: d.quantity + 1 } : d
                                ),
                                { shouldValidate: true }
                              );
                            } else {
                              setValue(
                                "details",
                                [...details, { productId: p.id, quantity: 1 }],
                                { shouldValidate: true }
                              );
                            }

                            await trigger("details");

                            setFilteredProducts([]);
                            setSearchTerm("");
                        }}
                      >
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          C.Barras: {p.barcode ?? p.codigoBarras ?? "N/A"} — SKU: {p.sku} — ${(p.purchasePrice ?? 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                {/* Sucursal (solo superadmin) */}
                {isSuperAdmin && (
                <FormSelect
                  label="Sucursal"
                  register={register("branchId", { valueAsNumber: true })}
                  error={errors.branchId?.message}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setValue("branchId", id, { shouldValidate: true });
                    setSelectedBranchId(id);   // <-- ESTA LÍNEA ES LA QUE FALTABA
                  }}
                >
                        <option value="0">Selecciona…</option>
                        {branches.data?.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </FormSelect>
                   
                )}
                {/* Proveedor */}
               <FormSelect
                  label="Proveedor"
                  register={register("providerId", { valueAsNumber: true })}
                  error={errors.providerId?.message as string}
                >
                  <option value="0">Selecciona…</option>
                  {providers.data?.map((p: CatalogItem) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </FormSelect>

                {/* Tabla de productos */}
                <div className="space-y-2">
                  {isLoading && <p>Cargando productos...</p>}
                  {error && <p className="text-red-600">Error al cargar productos</p>}
                  {!isLoading && !error && (
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Producto</th>
                          <th>SKU</th>
                          <th>Descripción</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          {isSuperAdmin && <th>Fecha Creación</th>}
                          {isSuperAdmin && <th>Tipo de negocio</th>}
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.map((d, i) => {
                          const list = Array.isArray(products)
                            ? products
                            : products?.content ?? [];
                          const prod = list.find((p) => p.id === Number(d.productId));
                          return (
                            <tr key={i} className="border-t">
                              
                              <td className="p-2">
                                  {/* campo oculto pero registrado en el form */}
                                  <input
                                    type="hidden"
                                    {...register(`details.${i}.productId` as const, { valueAsNumber: true })}
                                  />

                                  {/* mostramos solo el nombre del producto */}
                                  <span className="font-medium">
                                    {prod?.name ?? "Producto sin seleccionar"}
                                  </span>

                                  {/* mensaje de error si no hay producto */}
                                  {errors.details?.[i]?.productId && (
                                    <p className="text-red-600 text-xs mt-1">
                                      {errors.details[i]?.productId?.message as string}
                                    </p>
                                  )}
                                </td>
                              <td className="text-center">{prod?.sku ?? "—"}</td>
                              <td className="text-center">{prod?.description || "Sin descripción"}</td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    className="px-2 border rounded"
                                    onClick={() =>
                                      setValue(
                                        `details.${i}.quantity`,
                                        Math.max(1, (Number(d.quantity) || 1) - 1)
                                      )
                                    }
                                  >−</button>
                                  <input
                                    type="number"
                                    className="w-14 text-center border rounded"
                                    {...register(`details.${i}.quantity` as const)}
                                  />
                                  <button
                                    type="button"
                                    className="px-2 border rounded"
                                    onClick={() =>
                                      setValue(`details.${i}.quantity`, (Number(d.quantity) || 0) + 1)
                                    }
                                  >+</button>
                                </div>
                              </td>
                              <td className="text-center">
                                ${(prod?.purchasePrice ?? 0).toFixed(2)}
                              </td>
                              {isSuperAdmin && <td className="text-center">{prod?.creationDate?.split("T")[0]}</td>}
                              {isSuperAdmin && <td className="text-center">{prod?.businessTypeName ?? "—"}</td>}
                              <td className="text-center">
                                <button
                                  type="button"
                                  onClick={() => removeDetail(i)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Total y pago */}
                <div className="flex flex-col items-end gap-2 mt-4 border-t pt-3">
                  <div className="text-lg font-semibold">
                    TOTAL DE LA COMPRA: ${totalCompra.toFixed(2)}
                  </div>
  
                  {/* Tipo de pago */}
                  <div className="flex flex-col items-start w-43">
                    <FormSelect
                      label="Tipo de pago"
                      error={errors.paymentMethodId?.message as string}
                      register={register("paymentMethodId", { valueAsNumber: true })}
                      onChange={async (e) => {
                        const id = Number(e.target.value);
                        setValue("paymentMethodId", id, { shouldValidate: true });
                        await trigger("paymentMethodId");

                        const selected = paymentMethods.data?.find((m) => m.id === id);
                        const isNowCash = selected?.name?.toUpperCase() === "EFECTIVO";

                        setIsCash(isNowCash);

                        if (!isNowCash) {
                          setLocalCash("");
                          setValue("cashGiven", 0);
                          setValue("changeAmount", 0);
                        }
                      }}
                    >
                        <option value="0">Selecciona…</option>
                        {paymentMethods.data?.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </FormSelect>
                  </div>
               
                  {/* Pago en efectivo */}
                  {isCash && (
                    <div className="flex flex-col items-end gap-1 w-64">
                      <label className="flex flex-col gap-1 w-full">
                        <span className="text-sm text-right">Cantidad pagada ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          className={`border rounded px-3 py-2 text-right ${
                            Number(localCash) < totalCompra && localCash !== ""
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

                      {/* ⚠️ Advertencia */}
                      {Number(localCash) < totalCompra && localCash !== "" && (
                        <p className="text-yellow-700 text-sm text-right font-medium">
                          ⚠️ Debe pagar la cantidad exacta o superior (${totalCompra.toFixed(2)})
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
                {/* Footer */}
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded border"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isPending ||
                      (isCash && Number(localCash) < totalCompra)
                    }
                    className={`px-4 py-2 rounded text-white ${
                      isPending
                        ? "bg-blue-400"
                        : isCash && Number(localCash) < totalCompra
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } disabled:opacity-60`}
                  >
                    {isPending
                      ? "Guardando…"
                      : isCash && Number(localCash) < totalCompra
                      ? "Pago insuficiente"
                      : "Completar compra"}
                  </button>
                </div>
          </form>
          </DialogContent>
        </Dialog>

      <ConfirmarCompraModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCompraFinal}
        resumen={resumenCompra}
        isLoading={isPending}
      />

      <EnviarTicketCompraModal
        open={showTicketModal}
        compraId={compraIdCreada}
        onClose={() => setShowTicketModal(false)}
      />
    </>
  );
}

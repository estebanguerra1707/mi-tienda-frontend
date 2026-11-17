"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { z, ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateVenta } from "@/hooks/useVentas";
import { useClients } from "@/hooks/useClients";
import { usePaymentMethods, useBranches } from "@/hooks/useCatalogs";
import { useProductsByBranch } from "@/hooks/useProductsByBranch";
import { useAuth } from "@/hooks/useAuth";
import type { ClientItem } from "@/hooks/useClients";
import type { CatalogItem } from "@/hooks/useCatalogs";
import type { ProductItem } from "@/types/product";
import EnviarTicketModal from "@/features/ventas/components/EnviarTicketModal";
import ConfirmarVentaModal from "@/features/ventas/components/ConfirmarVentaModal";
import { ResumenVenta } from "@/types/catalogs";
import { toastError } from "@/lib/toast";
import { toastSuccess } from "@/lib/toastSuccess";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanener";
import { useDisableNumberWheel } from "@/hooks/useDisableNumberWheel";
import { LoadingButton } from "@/components/ui/LoadingButton";

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
        extras: z
          .array(
            z.object({
              productId: z.number(),
            })
          )
          .optional(),
        notes: z.string().optional(),
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

// Extensión segura de tipos opcionales para imagen y categoría sin romper ProductItem
type ExtendedProduct = ProductItem & {
  categoryName?: string | null;
  categoriaNombre?: string | null;
  categoria?: string | null;
  imageUrl?: string | null;
  imagenUrl?: string | null;
  imagen?: string | null;
};

interface OpenTicketLocal {
  id: string;
  name: string;
  comment: string;
  orderType: "Comer dentro" | "Para llevar" | "Envío";
  createdAt: string;
  employee: string;
  clientId: number;
  referenceName: string;
  details: VentaForm["details"];
  total: number;
}

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

const getProductCategoryName = (p: ProductItem): string => {
  const ext = p as ExtendedProduct;
  const rawCat = ext.categoryName || ext.categoriaNombre || ext.categoria;
  if (rawCat && String(rawCat).trim()) {
    return String(rawCat).trim();
  }
  const n = (p.name || "").toLowerCase();
  if (n.includes("chilaquil")) return "Chilaquiles";
  if (n.includes("crepa")) return "Crepas";
  if (
    n.includes("malteada") ||
    n.includes("cafe") ||
    n.includes("café") ||
    n.includes("jugo") ||
    n.includes("refresco") ||
    n.includes("agua")
  ) {
    return "Bebidas";
  }
  if (
    n.includes("postre") ||
    n.includes("pan") ||
    n.includes("waffle") ||
    n.includes("hot cake")
  ) {
    return "Postres y Pan";
  }
  return "Platillos";
};

const getProductImageUrl = (p: ProductItem): string | null => {
  const ext = p as ExtendedProduct;
  return ext.imageUrl || ext.imagenUrl || ext.imagen || null;
};

const makeZodResolver = <T extends object>(schema: ZodSchema<T>): Resolver<T> =>
  (zodResolver as unknown as (s: unknown) => unknown)(schema) as Resolver<T>;

const CATEGORY_COLORS = [
  "bg-red-600",
  "bg-orange-500",
  "bg-sky-500",
  "bg-pink-600",
  "bg-lime-500",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-500",
];

/* ---------- Componente ---------- */
export default function PanelNuevaVenta({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const { mutateAsync, isPending } = useCreateVenta();
  useDisableNumberWheel();
  const auth = useAuth();
  const isSuper = auth.hasRole?.("SUPER_ADMIN");
  const userBranchId = auth.user?.branchId ?? null;

  // Estados originales
  const [isCash, setIsCash] = useState(true);
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
  const { data: paymentMethodsRaw } = usePaymentMethods() as {
    data: CatalogItem[] | { content?: CatalogItem[]; data?: CatalogItem[] } | undefined;
  };
const paymentMethods = useMemo<CatalogItem[]>(() => {
    if (Array.isArray(paymentMethodsRaw) && paymentMethodsRaw.length > 0) {
      return paymentMethodsRaw;
    }
    if (paymentMethodsRaw && typeof paymentMethodsRaw === "object") {
      if ("content" in paymentMethodsRaw && Array.isArray(paymentMethodsRaw.content) && paymentMethodsRaw.content.length > 0) {
        return paymentMethodsRaw.content;
      }
      if ("data" in paymentMethodsRaw && Array.isArray(paymentMethodsRaw.data) && paymentMethodsRaw.data.length > 0) {
        return paymentMethodsRaw.data;
      }
    }
    // Respaldo por si el catálogo tarda o viene vacío
    return [
      { id: 1, name: "EFECTIVO" },
      { id: 2, name: "TARJETA" },
      { id: 3, name: "TRANSFERENCIA" },
    ];
  }, [paymentMethodsRaw]);  const [showResumenModal, setShowResumenModal] = useState(false);
  const [resumenVenta, setResumenVenta] = useState<ResumenVenta | null>(null);
  const ventaFormSnapshot = useRef<VentaForm | null>(null);
  const [extraProducts, setExtraProducts] = useState<ProductItem[]>([]);

  // Estados para POS Touch (Estilo Loyverse)
  const [isPosTouchView, setIsPosTouchView] = useState(true);
  useEffect(() => {
    const checkViewport = () => {
      if (window.innerWidth < 1024) {
        setIsPosTouchView(true);
      }
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSearchBarPos, setShowSearchBarPos] = useState(false);
  const [orderType, setOrderType] = useState<"Comer dentro" | "Para llevar" | "Envío">("Envío");
  const [mobileTicketDrawerOpen, setMobileTicketDrawerOpen] = useState(false);

  // Modal Táctil de Extras / Modificadores
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [activeProductForModal, setActiveProductForModal] = useState<ProductItem | null>(null);
  const [editingDetailIndex, setEditingDetailIndex] = useState<number | null>(null);
  const [tempExtras, setTempExtras] = useState<number[]>([]);
  const [tempQty, setTempQty] = useState<number>(1);
  const [tempNotes, setTempNotes] = useState<string>("");

  // Flujo de Tickets Abiertos
  const [openTickets, setOpenTickets] = useState<OpenTicketLocal[]>([]);
  const [showSaveTicketModal, setShowSaveTicketModal] = useState(false);
  const [showOpenTicketsListModal, setShowOpenTicketsListModal] = useState(false);
  const [ticketNameInput, setTicketNameInput] = useState("");
  const [ticketCommentInput, setTicketCommentInput] = useState("");

  // Flujo de Pantalla de Cobro Touch
  const [showTouchCheckout, setShowTouchCheckout] = useState(false);
  const [showTouchReceiptSuccess, setShowTouchReceiptSuccess] = useState(false);
  const [lastCompletedSummary, setLastCompletedSummary] = useState<{
    total: number;
    paid: number;
    change: number;
  } | null>(null);

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

  const isSubmittingRef = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);

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

  // Separación de Productos Principales vs Extras/Bases
  const mainProducts = useMemo(() => {
    return products.filter((p) => {
      const nombre = (p.name || "").toLowerCase();
      return !nombre.includes("extra") && !nombre.includes("base");
    });
  }, [products]);

  const availableExtras = useMemo(() => {
    return products
      .filter((p) => {
        const nombre = (p.name || "").toLowerCase();
        return nombre.includes("extra") || nombre.includes("base");
      })
      .sort((a, b) => {
        const aIsBase = (a.name || "").toLowerCase().includes("base") ? 0 : 1;
        const bIsBase = (b.name || "").toLowerCase().includes("base") ? 0 : 1;
        if (aIsBase !== bIsBase) return aIsBase - bIsBase;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [products]);

  // Agrupación dinámica de Categorías
  const dynamicCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; count: number }>();

    mainProducts.forEach((p) => {
      const catName = getProductCategoryName(p);
      if (!map.has(catName)) {
        const color = CATEGORY_COLORS[map.size % CATEGORY_COLORS.length];
        map.set(catName, { id: catName, name: catName, color, count: 1 });
      } else {
        const item = map.get(catName)!;
        item.count += 1;
      }
    });

    return Array.from(map.values());
  }, [mainProducts]);

  // Productos filtrados para la cuadrícula Touch
  const gridProducts = useMemo(() => {
    return mainProducts.filter((p) => {
      const catName = getProductCategoryName(p);
      const matchesCat = selectedCategory ? catName === selectedCategory : true;
      const matchesSearch = searchTerm.trim()
        ? (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.codigoBarras?.toString() ?? "").includes(searchTerm)
        : true;

      return matchesCat && matchesSearch;
    });
  }, [mainProducts, selectedCategory, searchTerm]);

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

  const { fields, remove, append, update } = useFieldArray({ control, name: "details" });
  const details = watch("details");
  const cashGiven = watch("cashGiven") ?? 0;
  const [scanBuffer, setScanBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [formError, setFormError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Cargar tickets abiertos guardados en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mi_inventario_open_tickets");
      if (saved) setOpenTickets(JSON.parse(saved) as OpenTicketLocal[]);
    } catch {
      // Ignorar errores de localStorage
    }
  }, []);

  const persistOpenTickets = (next: OpenTicketLocal[]) => {
    setOpenTickets(next);
    try {
      localStorage.setItem("mi_inventario_open_tickets", JSON.stringify(next));
    } catch {
      // Ignorar
    }
  };

  // Preseleccionar Efectivo por defecto cuando cargan los métodos de pago
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && watch("paymentMethodId") === 0) {
      const efectivo =
        paymentMethods.find((m) => m.name.toUpperCase().includes("EFECTIVO")) ??
        paymentMethods[0];
      if (efectivo) {
        setValue("paymentMethodId", efectivo.id);
        setIsCash(efectivo.name.toUpperCase().includes("EFECTIVO"));
      }
    }
  }, [paymentMethods, setValue, watch]);

  // Al tocar un producto en la cuadrícula Touch
  const handleTouchProductCard = async (product: ProductItem) => {
    const u = getUnidadUI(product);
    if (availableExtras.length > 0) {
      setActiveProductForModal(product);
      setEditingDetailIndex(null);
      setTempExtras([]);
      setTempQty(u.min);
      setTempNotes("");
      setModifierModalOpen(true);
    } else {
      append({
        productId: product.id,
        quantity: u.min,
        extras: [],
        notes: "",
        ownerType: usaInventarioPorDuenio ? "PROPIO" : undefined,
      });
      await trigger("details");
    }
  };

  // Al tocar un ítem que ya está en el Ticket para editar sus extras/cantidad/notas
  const handleEditTicketItem = (index: number) => {
    const item = details[index];
    if (!item) return;
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return;

    setActiveProductForModal(prod);
    setEditingDetailIndex(index);
    setTempExtras((item.extras ?? []).map((e) => e.productId));
    setTempQty(Number(item.quantity) || 1);
    setTempNotes(item.notes ?? "");
    setModifierModalOpen(true);
  };

  const toggleTempExtra = (extraId: number) => {
    setTempExtras((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const handleSaveModifierModal = async () => {
    if (!activeProductForModal) return;
    const formattedExtras = tempExtras.map((id) => ({ productId: id }));

    if (editingDetailIndex !== null) {
      update(editingDetailIndex, {
        productId: activeProductForModal.id,
        quantity: tempQty,
        extras: formattedExtras,
        notes: tempNotes.trim(),
        ownerType: usaInventarioPorDuenio ? "PROPIO" : undefined,
      });
    } else {
      append({
        productId: activeProductForModal.id,
        quantity: tempQty,
        extras: formattedExtras,
        notes: tempNotes.trim(),
        ownerType: usaInventarioPorDuenio ? "PROPIO" : undefined,
      });
    }

    setModifierModalOpen(false);
    setActiveProductForModal(null);
    setEditingDetailIndex(null);
    await trigger("details");
  };

  const selectProductFromSearch = async (product: ProductItem) => {
    if (isPosTouchView) {
      await handleTouchProductCard(product);
      setSearchTerm("");
      setFilteredProducts([]);
      return;
    }

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
              if (ex != null) {
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
    const term = searchTerm.toLowerCase();
    const results = mainProducts.filter((p) => {
      const nombre = (p.name || "").toLowerCase();
      return (
        nombre.includes(term) ||
        (p.codigoBarras?.toString() ?? "").includes(term) ||
        (p.barcode?.toString() ?? "").includes(term) ||
        (p.sku?.toLowerCase() ?? "").includes(term)
      );
    });
    setFilteredProducts(results);
  }, [searchTerm, products, mainProducts]);

  useEffect(() => {
    if (!isCash) {
      setValue("changeAmount", 0, { shouldValidate: false });
      return;
    }
    if (isNaN(cashGiven)) return;
    const nuevoCambio = cashGiven > totalVenta ? cashGiven - totalVenta : 0;
    setValue("changeAmount", nuevoCambio, { shouldValidate: false });
  }, [isCash, cashGiven, totalVenta, setValue]);

  // Guardar Ticket Abierto
  const handleOpenSaveTicketDialog = () => {
    const defaultName =
      watch("referenceName")?.trim() ||
      `Ticket - ${dayjs().format("h:mm a")}`;
    setTicketNameInput(defaultName);
    setTicketCommentInput("");
    setShowSaveTicketModal(true);
  };

  const handleConfirmSaveOpenTicket = () => {
    if (!ticketNameInput.trim()) return;
    const newTicket: OpenTicketLocal = {
      id: `ticket-${Date.now()}`,
      name: ticketNameInput.trim(),
      comment: ticketCommentInput.trim(),
      orderType,
      createdAt: dayjs().format("h:mm a"),
      employee: auth.user?.username ?? "Propietario",
      clientId: watch("clientId") ?? 0,
      referenceName: ticketNameInput.trim(),
      details: watch("details"),
      total: totalVenta,
    };

    persistOpenTickets([newTicket, ...openTickets]);
    setShowSaveTicketModal(false);
    resetAll();
    toastSuccess(`Ticket "${newTicket.name}" guardado en Tickets Abiertos`);
  };

  const handleLoadOpenTicket = (t: OpenTicketLocal) => {
    setValue("clientId", t.clientId);
    setValue("referenceName", t.referenceName);
    setValue("details", t.details, { shouldValidate: true });
    setOrderType(t.orderType);
    persistOpenTickets(openTickets.filter((item) => item.id !== t.id));
    setShowOpenTicketsListModal(false);
  };

  // Abrir pantalla de Cobro Touch
  const handleOpenTouchCheckout = () => {
    if (fields.length === 0) {
      toastError("Agrega al menos un producto al ticket.");
      return;
    }
    setLocalCash(totalVenta.toFixed(2));
    setValue("cashGiven", totalVenta);
    setValue("changeAmount", 0);
    setShowTouchCheckout(true);
  };

  // Billetes sugeridos dinámicos según el total
  const suggestedBills = useMemo(() => {
    if (totalVenta <= 0) return [50, 100, 200, 500];
    const nextTen = Math.ceil((totalVenta + 1) / 10) * 10;
    const candidates = [nextTen, 50, 100, 200, 500, 1000].filter((b) => b >= totalVenta);
    return Array.from(new Set(candidates)).slice(0, 4);
  }, [totalVenta]);

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

    if (showTouchCheckout) {
      await confirmarVentaFinal();
      return;
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

      const nombreAmostrar =
        nombresExtras.length > 0
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
      cliente:
        clients?.find((c) => c.id === values.clientId)?.name ??
        (values.referenceName || "Sin cliente"),
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
    if (isSubmittingRef.current || isPending || isConfirming) return;
    if (!ventaFormSnapshot.current) return;

    isSubmittingRef.current = true;
    setIsConfirming(true);
    setShowResumenModal(false);

    const v = ventaFormSnapshot.current;
    const pagoReal = Number(v.cashGiven ?? 0);
    const cambioReal = v.changeAmount ?? 0;

    const payload = {
      clientId: v.clientId === 0 ? null : v.clientId,
      clientName:
        v.clientId === 0
          ? v.referenceName?.trim() || `${orderType}`
          : null,
      paymentMethodId: v.paymentMethodId,
      saleDate: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      amountPaid: pagoReal,
      changeAmount: cambioReal,
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

      if (showTouchCheckout) {
        setLastCompletedSummary({
          total: totalVenta,
          paid: pagoReal,
          change: cambioReal,
        });
        setShowTouchCheckout(false);
        setShowTouchReceiptSuccess(true);
      } else {
        setShowSendEmailModal(true);
        resetAll();
      }

      onCreated();
    } catch (error: unknown) {
      if (!showTouchCheckout) setShowResumenModal(true);
      const err = error as BackendError;
      const message =
        err?.response?.data?.message ?? "Error inesperado al generar la venta";
      toastError(message);
    } finally {
      isSubmittingRef.current = false;
      setIsConfirming(false);
    }
  };

  const resetAll = useCallback(() => {
    const defaultPayment =
      paymentMethods?.find((m) => m.name.toUpperCase().includes("EFECTIVO"))?.id ??
      paymentMethods?.[0]?.id ??
      0;

    reset({
      clientId: 0,
      paymentMethodId: defaultPayment,
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
    setIsCash(true);
    setLocalCash("");
    setTotalVenta(0);
    setMobileTicketDrawerOpen(false);
  }, [reset, isSuper, userBranchId, paymentMethods]);

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

  // Sub-render del Panel de Ticket
  const renderTicketPanel = () => (
    <div className="flex flex-col h-full bg-[#2b3035] text-white select-none">
      {/* Cabecera del Ticket */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-[#23272b]">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold tracking-wide">Ticket</h3>
          {fields.length > 0 && (
            <span className="bg-lime-500 text-neutral-950 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {fields.reduce((acc, _, idx) => acc + (Number(details[idx]?.quantity) || 0), 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nombre / Mesa..."
            {...register("referenceName")}
            className="bg-neutral-800 border border-neutral-600 rounded px-2.5 py-1 text-xs text-white placeholder-neutral-400 w-32 focus:outline-none focus:border-lime-500"
          />
          {fields.length > 0 && (
            <button
              type="button"
              onClick={resetAll}
              title="Limpiar ticket"
              className="text-neutral-400 hover:text-red-400 p-1 text-sm"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Selector Tipo de Pedido */}
      <div className="px-4 py-2 border-b border-neutral-700 bg-[#262a2e] flex items-center justify-between">
        <select
          value={orderType}
          onChange={(e) =>
            setOrderType(e.target.value as "Envío")
          }
          className="bg-transparent text-sm font-semibold text-neutral-200 w-full outline-none cursor-pointer"
        >
          <option value="Envío" className="bg-neutral-800 text-white">
            🛵 Envío a domicilio
          </option>
        </select>
      </div>

      {/* Lista de Ítems del Ticket */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-700/60 px-4 custom-scrollbar">
        {fields.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-12 text-center">
            <span className="text-3xl mb-2 opacity-40">🧾</span>
            <p className="text-sm">Toca un producto para agregarlo al ticket</p>
          </div>
        ) : (
          fields.map((f, i) => {
            const item = details[i];
            const prod = products.find((p) => p.id === f.productId);
            if (!prod) return null;

            const qty = Number(item?.quantity ?? 1);
            let unitPrice = Number(prod.salePrice ?? 0);
            const itemExtras = item?.extras ?? [];
            const extraNames: string[] = [];

            itemExtras.forEach((ex) => {
              const pEx = products.find((px) => px.id === ex.productId);
              if (pEx) {
                unitPrice += Number(pEx.salePrice ?? 0);
                extraNames.push(pEx.name);
              }
            });

            const lineTotal = unitPrice * qty;

            return (
              <div
                key={f.id}
                onClick={() => handleEditTicketItem(i)}
                className="py-3 flex items-start justify-between gap-2 cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white leading-snug">
                    {prod.name}{" "}
                    <span className="text-lime-400 font-bold">x {qty}</span>
                  </div>
                  {extraNames.length > 0 && (
                    <div className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                      {extraNames.join(", ")}
                    </div>
                  )}
                  {item?.notes && (
                    <div className="text-[11px] italic text-amber-300 mt-0.5">
                      Nota: {item.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold tabular-nums text-white">
                    ${lineTotal.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(i);
                    }}
                    className="text-neutral-500 hover:text-red-400 px-1.5 py-0.5 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total y Botones Inferiores Verdes */}
      <div className="border-t border-neutral-700 bg-[#23272b] p-4 space-y-3">
        <div className="flex items-center justify-between text-base font-bold">
          <span className="text-neutral-300">Total</span>
          <span className="text-2xl text-white tabular-nums">
            ${totalVenta.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {fields.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowOpenTicketsListModal(true)}
              className="bg-[#4caf50] hover:bg-[#43a047] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm uppercase py-3.5 px-2 rounded-l-md shadow flex flex-col items-center justify-center leading-tight transition"
            >
              <span>TICKETS</span>
              <span>ABIERTOS ({openTickets.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenSaveTicketDialog}
              className="bg-[#4caf50] hover:bg-[#43a047] active:scale-[0.99] text-white font-extrabold text-sm uppercase py-3.5 px-3 rounded-l-md shadow flex items-center justify-center transition"
            >
              GUARDAR
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenTouchCheckout}
            disabled={fields.length === 0}
            className="bg-[#4caf50] hover:bg-[#43a047] disabled:opacity-40 active:scale-[0.99] text-white font-extrabold text-sm uppercase py-3.5 px-3 rounded-r-md shadow flex items-center justify-center transition"
          >
            COBRAR
          </button>
        </div>
      </div>
    </div>
  );

  /* =====================================================================
     RENDER PRINCIPAL: MODO POS TOUCH (TABLET / CELULAR / DESKTOP)
     ===================================================================== */
  if (isPosTouchView) {
    return (
      <div className="flex flex-col h-full w-full bg-[#1e2226] text-white relative overflow-hidden select-none">
        {/* PANTALLA COMPLETA DE COBRO */}
        {showTouchCheckout && (
          <div className="absolute inset-0 z-40 bg-[#2b3035] flex flex-col md:flex-row">
            <div className="hidden md:flex md:w-[36%] border-r border-neutral-700 flex-col bg-[#23272b] p-4">
              <div className="text-base font-bold pb-3 border-b border-neutral-700">
                {watch("referenceName") || `Ticket - ${dayjs().format("h:mm a")}`}
              </div>
              <div className="text-xs text-neutral-400 py-2 border-b border-neutral-700">
                {orderType}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-neutral-700/50 py-2">
                {fields.map((f, i) => {
                  const item = details[i];
                  const prod = products.find((p) => p.id === f.productId);
                  if (!prod) return null;
                  const qty = Number(item?.quantity ?? 1);
                  let unitPrice = Number(prod.salePrice ?? 0);
                  const names: string[] = [];
                  (item?.extras ?? []).forEach((ex) => {
                    const ep = products.find((px) => px.id === ex.productId);
                    if (ep) {
                      unitPrice += Number(ep.salePrice ?? 0);
                      names.push(ep.name);
                    }
                  });
                  return (
                    <div key={f.id} className="py-2.5 flex justify-between text-sm">
                      <div>
                        <div className="font-semibold">
                          {prod.name} x {qty}
                        </div>
                        {names.length > 0 && (
                          <div className="text-xs text-neutral-400">{names.join(", ")}</div>
                        )}
                      </div>
                      <div className="font-bold">${(unitPrice * qty).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-neutral-700 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalVenta.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-[#23272b]">
                <button
                  type="button"
                  onClick={() => setShowTouchCheckout(false)}
                  className="flex items-center gap-2 text-neutral-200 hover:text-white font-semibold text-sm py-1 px-2"
                >
                  ← Regresar al ticket
                </button>
                <div className="flex items-center gap-2">
                  <select
                    {...register("clientId", { valueAsNumber: true })}
                    onChange={(e) => setValue("clientId", Number(e.target.value))}
                    className="bg-neutral-800 border border-neutral-600 rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value={0}>Cliente General</option>
                    {clients?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-xl mx-auto w-full space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-white tabular-nums">
                    ${totalVenta.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">
                    Importe total adeudado
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-xs font-bold text-lime-400 uppercase tracking-wider">
                    Efectivo recibido
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                        💵 $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={localCash}
                        onChange={(e) => {
                          setLocalCash(e.target.value);
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setValue("cashGiven", val);
                          }
                        }}
                        className="w-full bg-transparent border-b-2 border-neutral-500 focus:border-lime-400 pl-12 pr-3 py-2 text-xl font-bold text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isPending || isConfirming}
                      onClick={() => {
                        const efectivoMethod = paymentMethods?.find((m) =>
                          m.name.toUpperCase().includes("EFECTIVO")
                        );
                        if (efectivoMethod) setValue("paymentMethodId", efectivoMethod.id);
                        setIsCash(true);
                        handleSubmit(onSubmit)();
                      }}
                      className="bg-[#4caf50] hover:bg-[#43a047] text-white font-extrabold px-6 py-3 rounded shadow uppercase text-sm"
                    >
                      {isPending || isConfirming ? "..." : "COBRAR"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 w-full">
                  {suggestedBills.map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => {
                        setLocalCash(bill.toFixed(2));
                        setValue("cashGiven", bill);
                        setValue("changeAmount", Math.max(bill - totalVenta, 0));
                      }}
                      className="bg-neutral-700/70 hover:bg-neutral-600 border border-neutral-500 py-3 rounded text-sm font-bold text-white transition active:scale-95"
                    >
                      ${bill.toFixed(2)}
                    </button>
                  ))}
                </div>

                <div className="w-full space-y-2 pt-2">
                  {paymentMethods
                    ?.filter((m) => !m.name.toUpperCase().includes("EFECTIVO"))
                    .map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        disabled={isPending || isConfirming}
                        onClick={() => {
                          setValue("paymentMethodId", method.id);
                          setIsCash(false);
                          setValue("cashGiven", totalVenta);
                          setValue("changeAmount", 0);
                          handleSubmit(onSubmit)();
                        }}
                        className="w-full bg-neutral-700/60 hover:bg-neutral-600 border border-neutral-500 py-3.5 px-4 rounded font-bold text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 transition"
                      >
                        💳 {method.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANTALLA FINAL DE CONFIRMACIÓN Y CAMBIO */}
        {showTouchReceiptSuccess && lastCompletedSummary && (
          <div className="absolute inset-0 z-50 bg-[#2b3035] flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full space-y-8 text-center">
              <div className="grid grid-cols-2 gap-4 border-b border-neutral-700 pb-6">
                <div>
                  <div className="text-3xl font-extrabold text-white tabular-nums">
                    ${lastCompletedSummary.paid.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Total pagado</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-lime-400 tabular-nums">
                    ${lastCompletedSummary.change.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Cambio</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSendEmailModal(true)}
                className="w-full bg-neutral-700 hover:bg-neutral-600 border border-neutral-500 py-3.5 rounded font-bold text-sm uppercase text-white flex items-center justify-center gap-2"
              >
                ✉️ Enviar recibo por correo
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTouchReceiptSuccess(false);
                  setLastCompletedSummary(null);
                  resetAll();
                }}
                className="w-full bg-[#4caf50] hover:bg-[#43a047] text-white font-extrabold py-4 rounded shadow-lg uppercase text-sm tracking-wider"
              >
                ✓ + NUEVA VENTA
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT PRINCIPAL DIVIDIDO: Cuadrícula Izquierda + Ticket Derecha */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 bg-[#1e2226] border-r border-neutral-800">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800 bg-[#262a2e] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {selectedCategory ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-lime-400 truncate"
                  >
                    <span>←</span>
                    <span>Todos los Productos</span>
                    <span className="text-neutral-400">›</span>
                    <span className="text-lime-400 truncate">{selectedCategory}</span>
                  </button>
                ) : (
                  <span className="text-sm font-bold text-white px-1">
                    Todos los Productos
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isSuper && (
                  <select
                    value={selectedBranchId ?? 0}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedBranchId(id);
                      setValue("details", []);
                      setExtraProducts([]);
                    }}
                    className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value={0}>Sucursal...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}

                {showSearchBarPos ? (
                  <div className="flex items-center bg-neutral-800 border border-neutral-600 rounded px-2 py-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent text-xs text-white outline-none w-28 sm:w-40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setShowSearchBarPos(false);
                      }}
                      className="text-neutral-400 hover:text-white text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSearchBarPos(true)}
                    className="p-2 rounded hover:bg-neutral-700 text-neutral-200"
                    title="Buscar producto"
                  >
                    🔍
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="p-2 rounded bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs"
                  title="Escanear código"
                >
                  📷
                </button>

                <button
                  type="button"
                  onClick={() => setIsPosTouchView(false)}
                  className="hidden lg:inline-flex items-center gap-1 p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 border border-neutral-700"
                  title="Cambiar a formulario clásico"
                >
                  📋 Clásico
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
              {!selectedCategory && !searchTerm.trim() && dynamicCategories.length > 1 && (
                <div className="mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2 px-1">
                    Categorías
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {dynamicCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`${cat.color} h-20 sm:h-24 rounded-md p-2.5 flex flex-col justify-between text-left shadow hover:brightness-110 active:scale-95 transition relative overflow-hidden`}
                      >
                        <div className="flex justify-end w-full">
                          <span className="text-white/80 text-xs">📁</span>
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-2">
                          {cat.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2 px-1">
                  {selectedCategory ? `Artículos en ${selectedCategory}` : "Todos los artículos"}
                </div>
                {gridProducts.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-sm">
                    No se encontraron productos en esta vista.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 pb-20 md:pb-4">
                    {gridProducts.map((prod) => {
                      const lower = (prod.name || "").toLowerCase();
                      const isVerde = lower.includes("verde");
                      const isRojo = lower.includes("rojo");
                      const isPan = lower.includes("pan");
                      const imgUrl = getProductImageUrl(prod);

                      const cardTone = isVerde
                        ? "from-emerald-600 to-emerald-800 border-emerald-500/80"
                        : isRojo
                        ? "from-red-600 to-red-800 border-red-500/80"
                        : isPan
                        ? "from-purple-600 to-purple-800 border-purple-500/80"
                        : "from-slate-600 to-slate-800 border-slate-500/70";

                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleTouchProductCard(prod)}
                          className={`group relative h-28 sm:h-32 rounded-lg overflow-hidden border bg-gradient-to-br ${cardTone} p-2.5 shadow-md hover:brightness-110 active:scale-95 transition flex flex-col justify-between text-left`}
                        >
                          {imgUrl && (
                            <img
                              src={imgUrl}
                              alt={prod.name}
                              className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform"
                            />
                          )}

                          {/* Precio grande arriba */}
                          <div className="relative z-10 flex justify-between items-start w-full">
                            <span className="text-base sm:text-lg font-black bg-black/35 text-lime-300 px-2 py-0.5 rounded-md shadow-sm tracking-tight tabular-nums">
                              ${Number(prod.salePrice ?? 0).toFixed(0)}
                            </span>
                          </div>

                          {/* Nombre del producto directo en el bloque de color */}
                          <div className="relative z-10 mt-auto w-full pt-1">
                            <div className="text-xs sm:text-sm font-extrabold text-white leading-snug line-clamp-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                              {prod.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block md:w-[320px] lg:w-[360px] shrink-0 h-full">
            {renderTicketPanel()}
          </div>
        </div>

        {/* BARRA INFERIOR FIJA EN CELULAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#23272b] border-t border-neutral-700 p-2 flex items-center gap-2 shadow-2xl">
          <button
            type="button"
            onClick={() => setMobileTicketDrawerOpen(true)}
            className="flex-1 bg-neutral-800 border border-neutral-600 rounded px-3 py-2.5 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-[11px] text-neutral-400">
                Ticket ({fields.length} ítems)
              </div>
              <div className="text-base font-extrabold text-white">
                ${totalVenta.toFixed(2)}
              </div>
            </div>
            <span className="text-xs font-bold text-lime-400">▲ Ver</span>
          </button>

          {fields.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowOpenTicketsListModal(true)}
              className="bg-[#4caf50] text-white font-extrabold text-xs uppercase px-3 py-3 rounded shadow"
            >
              Abiertos ({openTickets.length})
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenSaveTicketDialog}
              className="bg-neutral-700 text-white font-extrabold text-xs uppercase px-3 py-3 rounded shadow"
            >
              Guardar
            </button>
          )}

          <button
            type="button"
            disabled={fields.length === 0}
            onClick={handleOpenTouchCheckout}
            className="bg-[#4caf50] disabled:opacity-40 text-white font-extrabold text-xs uppercase px-4 py-3 rounded shadow"
          >
            Cobrar
          </button>
        </div>

        {/* DRAWER DESPLEGABLE DEL TICKET EN CELULAR */}
        {mobileTicketDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/75 flex flex-col justify-end">
            <div className="h-[82vh] w-full bg-[#2b3035] rounded-t-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-[#1e2226] border-b border-neutral-700">
                <span className="text-xs font-bold text-neutral-400 uppercase">
                  Detalle del Ticket
                </span>
                <button
                  type="button"
                  onClick={() => setMobileTicketDrawerOpen(false)}
                  className="text-sm font-bold text-white px-2 py-1"
                >
                  ✕ Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{renderTicketPanel()}</div>
            </div>
          </div>
        )}

        {/* MODAL TÁCTIL DE MODIFICADORES / EXTRAS */}
        {modifierModalOpen && activeProductForModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-[1px] flex items-center justify-center p-3">
            <div className="bg-[#343a40] text-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-600 bg-[#2b3035]">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setModifierModalOpen(false)}
                    className="text-neutral-300 hover:text-white text-lg font-bold px-1"
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-base sm:text-lg truncate">
                    {activeProductForModal.name} $
                    {(
                      Number(activeProductForModal.salePrice ?? 0) +
                      tempExtras.reduce((acc, id) => {
                        const ep = products.find((p) => p.id === id);
                        return acc + Number(ep?.salePrice ?? 0);
                      }, 0)
                    ).toFixed(2)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleSaveModifierModal}
                  className="text-lime-400 hover:text-lime-300 font-extrabold text-sm uppercase tracking-wider px-2 py-1"
                >
                  GUARDAR
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {availableExtras.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-lime-400 uppercase tracking-wide">
                      Proteínas Base y Extras
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {availableExtras.map((extra) => {
                        const isSelected = tempExtras.includes(extra.id);
                        return (
                          <button
                            key={extra.id}
                            type="button"
                            onClick={() => toggleTempExtra(extra.id)}
                            className={`p-3 rounded border text-left flex items-center justify-between transition active:scale-[0.98] ${
                              isSelected
                                ? "bg-[#4caf50] border-lime-400 text-white font-bold shadow"
                                : "bg-[#3f464d] border-neutral-500 text-neutral-100 hover:bg-neutral-600"
                            }`}
                          >
                            <span className="text-xs sm:text-sm leading-tight pr-2">
                              {extra.name}
                            </span>
                            <span className="text-xs sm:text-sm font-bold shrink-0">
                              +${Number(extra.salePrice ?? 0).toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-neutral-600">
                  <div className="text-xs font-bold text-lime-400 uppercase tracking-wide">
                    Cantidad
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const u = getUnidadUI(activeProductForModal);
                        setTempQty((prev) =>
                          Math.max(u.min, Number((prev - u.step).toFixed(2)))
                        );
                      }}
                      className="w-12 h-11 rounded bg-[#3f464d] hover:bg-neutral-600 border border-neutral-500 text-xl font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={tempQty}
                      onChange={(e) =>
                        setTempQty(Math.max(0.1, Number(e.target.value) || 1))
                      }
                      className="flex-1 bg-transparent border-b border-neutral-500 text-center text-lg font-bold py-1.5 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const u = getUnidadUI(activeProductForModal);
                        setTempQty((prev) => Number((prev + u.step).toFixed(2)));
                      }}
                      className="w-12 h-11 rounded bg-[#3f464d] hover:bg-neutral-600 border border-neutral-500 text-xl font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-bold text-lime-400 uppercase tracking-wide">
                    Comentario
                  </div>
                  <input
                    type="text"
                    placeholder="Introducir comentario (ej. Sin cebolla, bien dorados...)"
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full bg-transparent border-b border-neutral-500 focus:border-lime-400 py-2 text-sm text-white placeholder-neutral-400 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL GUARDAR TICKET ABIERTO */}
        {showSaveTicketModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-[#343a40] text-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-600 bg-[#2b3035]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSaveTicketModal(false)}
                    className="text-neutral-300 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-base">Guardar ticket</h3>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmSaveOpenTicket}
                  className="text-lime-400 hover:text-lime-300 font-extrabold text-sm uppercase"
                >
                  GUARDAR
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-lime-400 block mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={ticketNameInput}
                    onChange={(e) => setTicketNameInput(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-lime-500 py-1.5 text-base font-semibold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    Comentario
                  </label>
                  <input
                    type="text"
                    value={ticketCommentInput}
                    onChange={(e) => setTicketCommentInput(e.target.value)}
                    placeholder="Nota opcional..."
                    className="w-full bg-transparent border-b border-neutral-500 py-1.5 text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL LISTA DE TICKETS ABIERTOS */}
        {showOpenTicketsListModal && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-[#343a40] text-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-600 bg-[#2b3035]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOpenTicketsListModal(false)}
                    className="text-neutral-300 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-base">Tickets abiertos</h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-neutral-700 p-2">
                {openTickets.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 text-sm">
                    No hay tickets abiertos guardados.
                  </div>
                ) : (
                  openTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleLoadOpenTicket(t)}
                      className="p-3.5 hover:bg-white/5 flex items-center justify-between cursor-pointer rounded transition"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{t.name}</div>
                        <div className="text-xs text-neutral-400">
                          {t.createdAt} • {t.employee}
                        </div>
                        {t.comment && (
                          <div className="text-xs text-amber-300 mt-0.5">{t.comment}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-base text-lime-400">
                          ${t.total.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            persistOpenTickets(openTickets.filter((x) => x.id !== t.id));
                          }}
                          className="text-neutral-400 hover:text-red-400 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <EnviarTicketModal
          ventaId={ventaIdCreada}
          open={showSendEmailModal}
          onClose={() => setShowSendEmailModal(false)}
        />

        {showScanner && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[20000] flex items-center justify-center">
            <div className="bg-white text-slate-900 rounded-xl p-4 w-[95%] max-w-md shadow-xl relative">
              <h2 className="text-xl font-semibold mb-3 text-center">Escanear código</h2>
              <BarcodeCameraScanner
                onResult={(code) => {
                  setShowScanner(false);
                  handleBarcodeScan(code);
                }}
                onError={(e) => console.error("Error escáner:", e)}
              />
              <button
                type="button"
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

  /* =====================================================================
     RENDER SECUNDARIO: VISTA FORMULARIO CLÁSICO COMPLETO (ESCRITORIO)
     ===================================================================== */
  return (
    <div className="flex flex-col h-full bg-white relative shadow-md">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800">
            Registrar nueva venta
          </h2>
          <button
            type="button"
            onClick={() => setIsPosTouchView(true)}
            className="text-xs bg-slate-900 text-lime-400 font-bold px-2.5 py-1 rounded-md shadow hover:bg-slate-800"
          >
            📱 Modo POS Touch
          </button>
        </div>
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

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <form
          onSubmit={handleSubmit(onSubmit, () =>
            setFormError("⚠️ Revisa los campos obligatorios.")
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
                    const selected =
                      filteredProducts[activeProductIndex] ?? filteredProducts[0];
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

            {/* Dropdown de resultados con colores para Verdes, Rojos y Pan */}
            {filteredProducts.length > 0 && (
              <div className="absolute z-20 bg-white border rounded shadow-lg w-full mt-1 max-h-56 overflow-y-auto">
                {filteredProducts.map((p, index) => {
                  const isActive = index === activeProductIndex;
                  const lowerName = (p.name || "").toLowerCase();
                  const isVerde = lowerName.includes("verde");
                  const isRojo = lowerName.includes("rojo");
                  const isPan = lowerName.includes("pan");

                  let itemClass = "";
                  let subTextClass = "";

                  if (isActive) {
                    itemClass = isVerde
                      ? "bg-green-600 text-white"
                      : isRojo
                      ? "bg-red-600 text-white"
                      : isPan
                      ? "bg-purple-600 text-white"
                      : "bg-blue-600 text-white";
                    subTextClass = "text-white/80";
                  } else {
                    itemClass = isVerde
                      ? "bg-green-100 text-green-900 hover:bg-green-200"
                      : isRojo
                      ? "bg-red-100 text-red-900 hover:bg-red-200"
                      : isPan
                      ? "bg-purple-100 text-purple-900 hover:bg-purple-200"
                      : "bg-white text-slate-900 hover:bg-blue-50";
                    subTextClass = isVerde
                      ? "text-green-700"
                      : isRojo
                      ? "text-red-700"
                      : isPan
                      ? "text-purple-700"
                      : "text-slate-500";
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

          {/* Lista de Productos Agregados con colores, extras y notas */}
          <div className="border-t pt-3 space-y-3">
            {fields.length === 0 ? (
              <div className="text-gray-500 text-sm italic py-4 text-center bg-gray-50 rounded-lg border border-dashed">
                Agrega productos para comenzar la venta.
              </div>
            ) : (
              fields.map((f, i) => {
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
                const isPan = lowerName.includes("pan");
                const rowBgClass = isVerde
                  ? "bg-green-50 border-green-200"
                  : isRojo
                  ? "bg-red-50 border-red-200"
                  : isPan
                  ? "bg-purple-50 border-purple-200"
                  : "border-slate-200";
                const titleClass = isVerde
                  ? "text-green-900"
                  : isRojo
                  ? "text-red-900"
                  : isPan
                  ? "text-purple-900"
                  : "text-slate-800";
                const u = getUnidadUI(prod);

                return (
                  <div
                    key={f.id}
                    className={`flex flex-col gap-2 border rounded-lg p-3 ${rowBgClass} relative`}
                  >
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
                      <div className="font-semibold text-slate-800 text-right">
                        ${precioMostrar.toFixed(2)}
                      </div>
                    </div>

                    {/* Render Extras */}
                    {extrasDeEstePlatillo.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {extrasDeEstePlatillo.map((ex, exIdx) => {
                          const prodExtra = products.find(
                            (pEx) => pEx.id === ex.productId
                          );
                          return (
                            <div
                              key={exIdx}
                              className="flex items-center justify-between text-xs bg-blue-50/70 p-1.5 rounded border border-blue-100"
                            >
                              <span className="truncate font-medium text-blue-900">
                                + {prodExtra?.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-green-700">
                                  ${prodExtra?.salePrice?.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  className="text-red-500 font-bold px-1"
                                  onClick={() => {
                                    const nuevosExtras = [...extrasDeEstePlatillo];
                                    nuevosExtras.splice(exIdx, 1);
                                    setValue(`details.${i}.extras`, nuevosExtras, {
                                      shouldValidate: true,
                                    });
                                  }}
                                >
                                  ✕
                                </button>
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
                      {availableExtras.map((p) => {
                        const lowerNameExtra = (p.name || "").toLowerCase();
                        const isBase = lowerNameExtra.includes("base");
                        const isPanExtra =
                          lowerNameExtra.includes("pan") &&
                          lowerNameExtra.includes("extra");

                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            className={
                              isBase
                                ? "text-blue-700 font-bold bg-blue-50"
                                : isPanExtra
                                ? "text-orange-600 font-bold bg-orange-50"
                                : "text-slate-700"
                            }
                          >
                            {isBase ? "🔹 " : ""}
                            {p.name} (+${p.salePrice?.toFixed(2)})
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
              })
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
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
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
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {errors.paymentMethodId && (
              <p className="text-red-600 text-xs">
                {errors.paymentMethodId.message}
              </p>
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
            {localCash !== "" && Number(localCash) < totalVenta && (
              <p className="text-yellow-600 text-xs mt-1">
                ⚠️ El pago es menor al total (Venta PARCIAL / PENDIENTE).
              </p>
            )}
            {!isCash && localCash !== "" && Number(localCash) > totalVenta && (
              <p className="text-red-600 text-xs mt-1">
                ⚠️ No se da cambio físico en métodos electrónicos.
              </p>
            )}
          </label>
        </form>
      </div>

      <div className="border-t bg-slate-50 p-4 mt-auto">
        <div className="flex justify-between items-end mb-4">
          <div>
            {isCash &&
              watch("changeAmount") !== undefined &&
              watch("changeAmount")! > 0 && (
                <div className="text-sm text-gray-600">
                  Cambio:{" "}
                  <span className="font-bold text-green-700">
                    ${watch("changeAmount")?.toFixed(2)}
                  </span>
                </div>
              )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 font-semibold mb-1">
              TOTAL VENTA
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${totalVenta.toFixed(2)}
            </div>
          </div>
        </div>

        <LoadingButton
          type="button"
          onClick={handleSubmit(onSubmit)}
          isLoading={isPending || isConfirming}
          loadingText="Procesando comanda..."
          disabled={fields.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold rounded-lg shadow-md transition"
        >
          GENERAR COMANDA
        </LoadingButton>
      </div>

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
    </div>
  );
}
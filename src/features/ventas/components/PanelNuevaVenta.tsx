"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
const comboSlotSchema = z.object({
  salsaId: z.number().nullable(),
  baseId: z.number().nullable(),
  extraIds: z.array(z.number()),
  note: z.string(),
});

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
        // Campos solo de UI para recordar la configuración por chilaquil al editar
        comboSlots: z.array(comboSlotSchema).optional(),
        comboEnvioId: z.number().nullable().optional(),
      })
    )
    .min(1, "Debe agregar al menos un producto"),
});

type VentaForm = z.infer<typeof schema>;
type ChilaquilSlot = z.infer<typeof comboSlotSchema>;

type UnidadUI = {
  label: string;
  step: number;
  min: number;
  esPieza: boolean;
  esMetro: boolean;
};

type ExtendedProduct = ProductItem & {
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

const createEmptySlot = (): ChilaquilSlot => ({
  salsaId: null,
  baseId: null,
  extraIds: [],
  note: "",
});

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
  if (p.categoryName && p.categoryName.trim()) {
    return p.categoryName.trim();
  }
  const n = (p.name || "").toLowerCase();
  if (n.includes("chilaquil") || n.includes("combo")) return "Chilaquiles";
  if (
    n.includes("malteada") ||
    n.includes("cafe") ||
    n.includes("café") ||
    n.includes("jugo") ||
    n.includes("refresco") ||
    n.includes("agua") ||
    n.includes("coca")
  ) {
    return "Bebidas";
  }
  if (n.includes("postre") || n.includes("pan") || n.includes("hot cake")) {
    return "Postres y Pan";
  }
  return "Platillos";
};

const getProductImageUrl = (p: ProductItem): string | null => {
  const ext = p as ExtendedProduct;
  return ext.imageUrl || ext.imagenUrl || ext.imagen || null;
};

const isSweetProduct = (p: ProductItem): boolean => {
  const text = `${p.name || ""} ${p.categoryName || ""} ${
    p.description || ""
  }`.toLowerCase();
  return (
    text.includes("hotcake") ||
    text.includes("hot cake") ||
    text.includes("postre") ||
    text.includes("pan") ||
    text.includes("waffle") ||
    text.includes("crepa")
  );
};

const isSweetExtra = (p: ProductItem): boolean => {
  const cat = (p.categoryName || "").toLowerCase();
  if (
    cat.includes("postre") ||
    cat.includes("dulce") ||
    cat.includes("hotcake")
  ) {
    return true;
  }
  const n = (p.name || "").toLowerCase();
  return (
    n.includes("avellana") ||
    n.includes("nutella") ||
    n.includes("durazno") ||
    n.includes("fresa") ||
    n.includes("lechera") ||
    n.includes("mermelada") ||
    n.includes("cajeta") ||
    n.includes("chocolate") ||
    n.includes("platano") ||
    n.includes("plátano") ||
    n.includes("chantilly") ||
    n.includes("nuez") ||
    n.includes("pan extra")
  );
};

const isComboProduct = (p: ProductItem): boolean => {
  if (isSweetProduct(p)) return false;
  const n = (p.name || "").toLowerCase();
  return (
    n.includes("combo") ||
    n.includes("duo") ||
    n.includes("dúo") ||
    n.includes("pareja") ||
    n.includes("trio") ||
    n.includes("trío")
  );
};

const getComboChilaquilCount = (p: ProductItem): number => {
  // Postres / Hotcakes siempre se manejan como 1 sola orden (nunca divididos en pestañas)
  if (isSweetProduct(p)) return 1;

  const text = `${p.name || ""} | ${p.description || ""}`.toLowerCase();
  const numMatch = text.match(/(\d+)\s*(?:chilaquil\w*|rellenit\w*)/i);
  if (numMatch) {
    const parsed = parseInt(numMatch[1], 10);
    if (parsed >= 2 && parsed <= 10) return parsed;
  }
  if (text.includes("trio") || text.includes("trío")) return 3;
  if (text.includes("duo") || text.includes("dúo") || text.includes("pareja")) {
    return 2;
  }
  return 1;
};

const getProductVisuals = (p: ProductItem) => {
  const n = (p.name || "").toLowerCase();

  if (n.includes("hotcake") || n.includes("hot cake")) {
    return {
      tone: "from-amber-600 to-orange-900 border-amber-400/80",
      icon: "🥞",
    };
  }
  if (isComboProduct(p)) {
    return {
      tone: "from-orange-600 to-amber-800 border-amber-400/80",
      icon: "🍱",
    };
  }
  if (n.includes("verde")) {
    return {
      tone: "from-emerald-600 to-emerald-800 border-emerald-500/80",
      icon: "🌶️",
    };
  }
  if (n.includes("rojo")) {
    return {
      tone: "from-red-600 to-red-800 border-red-500/80",
      icon: "🔥",
    };
  }
  if (n.includes("coca") || n.includes("refresco") || n.includes("pepsi")) {
    return {
      tone: "from-rose-700 to-red-950 border-rose-500/70",
      icon: "🥤",
    };
  }
  if (n.includes("cafe") || n.includes("café")) {
    return {
      tone: "from-amber-800 to-stone-900 border-amber-600/70",
      icon: "☕",
    };
  }
  if (n.includes("agua") || n.includes("jugo")) {
    return {
      tone: "from-sky-600 to-blue-800 border-sky-400/70",
      icon: "🧃",
    };
  }
  if (n.includes("pan") || n.includes("postre") || n.includes("crepa")) {
    return {
      tone: "from-purple-600 to-purple-900 border-purple-500/80",
      icon: "🥐",
    };
  }
  return {
    tone: "from-slate-600 to-slate-800 border-slate-500/70",
    icon: "🍽️",
  };
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
    data:
      | CatalogItem[]
      | { content?: CatalogItem[]; data?: CatalogItem[] }
      | undefined;
  };

  const paymentMethods = useMemo<CatalogItem[]>(() => {
    if (Array.isArray(paymentMethodsRaw) && paymentMethodsRaw.length > 0) {
      return paymentMethodsRaw;
    }
    if (paymentMethodsRaw && typeof paymentMethodsRaw === "object") {
      if (
        "content" in paymentMethodsRaw &&
        Array.isArray(paymentMethodsRaw.content) &&
        paymentMethodsRaw.content.length > 0
      ) {
        return paymentMethodsRaw.content;
      }
      if (
        "data" in paymentMethodsRaw &&
        Array.isArray(paymentMethodsRaw.data) &&
        paymentMethodsRaw.data.length > 0
      ) {
        return paymentMethodsRaw.data;
      }
    }
    return [
      { id: 1, name: "EFECTIVO" },
      { id: 2, name: "TARJETA" },
      { id: 3, name: "TRANSFERENCIA" },
    ];
  }, [paymentMethodsRaw]);

  const [showResumenModal, setShowResumenModal] = useState(false);
  const [resumenVenta, setResumenVenta] = useState<ResumenVenta | null>(null);
  const ventaFormSnapshot = useRef<VentaForm | null>(null);
  const [extraProducts, setExtraProducts] = useState<ProductItem[]>([]);

  // Estados para POS Touch
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
  const [orderType, setOrderType] = useState<
    "Comer dentro" | "Para llevar" | "Envío"
  >("Envío");
  const [mobileTicketDrawerOpen, setMobileTicketDrawerOpen] = useState(false);

  // Modal Táctil de Extras / Modificadores (Soporta 1 o N chilaquiles por combo)
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [activeProductForModal, setActiveProductForModal] =
    useState<ProductItem | null>(null);
  const [editingDetailIndex, setEditingDetailIndex] = useState<number | null>(
    null
  );
  const [modalSlots, setModalSlots] = useState<ChilaquilSlot[]>([
    createEmptySlot(),
  ]);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [modalEnvioId, setModalEnvioId] = useState<number | null>(null);
  const [tempQty, setTempQty] = useState<number>(1);

  // Flujo de Tickets Abiertos
  const [openTickets, setOpenTickets] = useState<OpenTicketLocal[]>([]);
  const [showSaveTicketModal, setShowSaveTicketModal] = useState(false);
  const [showOpenTicketsListModal, setShowOpenTicketsListModal] =
    useState(false);
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

  // Subgrupos de Extras para la UI del modal táctil
const groupedExtras = useMemo(() => {
    const salsas: ProductItem[] = [];
    const bases: ProductItem[] = [];
    const envios: ProductItem[] = [];
    const savoryToppings: ProductItem[] = [];
    const sweetToppings: ProductItem[] = [];

    availableExtras.forEach((item) => {
      const n = (item.name || "").toLowerCase();
      if (n.includes("salsa")) {
        salsas.push(item);
      } else if (n.includes("base")) {
        bases.push(item);
      } else if (n.includes("envio") || n.includes("envío")) {
        envios.push(item);
      } else if (isSweetExtra(item)) {
        sweetToppings.push(item);
      } else {
        savoryToppings.push(item);
      }
    });

    return { salsas, bases, envios, savoryToppings, sweetToppings };
  }, [availableExtras]);

  // Agrupación dinámica de Categorías
  const dynamicCategories = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; color: string; count: number }
    >();

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
          (p.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const { fields, remove, append, update } = useFieldArray({
    control,
    name: "details",
  });
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
    if (
      paymentMethods &&
      paymentMethods.length > 0 &&
      watch("paymentMethodId") === 0
    ) {
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
    const cat = getProductCategoryName(product).toLowerCase();
    const esBebida = cat.includes("bebida");

    if (availableExtras.length > 0 && !esBebida) {
      const slotCount = getComboChilaquilCount(product);
      setActiveProductForModal(product);
      setEditingDetailIndex(null);
      setModalSlots(Array.from({ length: slotCount }, () => createEmptySlot()));
      setActiveSlotIdx(0);
      setModalEnvioId(null);
      setTempQty(u.min);
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

    const slotCount = getComboChilaquilCount(prod);
    setActiveProductForModal(prod);
    setEditingDetailIndex(index);
    setTempQty(Number(item.quantity) || 1);
    setActiveSlotIdx(0);

    if (item.comboSlots && item.comboSlots.length > 0) {
      setModalSlots(
        item.comboSlots.map((s) => ({
          salsaId: s.salsaId,
          baseId: s.baseId,
          extraIds: [...s.extraIds],
          note: s.note,
        }))
      );
      setModalEnvioId(item.comboEnvioId ?? null);
    } else {
      // Reconstruir configuración si fue agregado desde modo clásico o ticket guardado antiguo
      const initialSlots = Array.from({ length: slotCount }, () =>
        createEmptySlot()
      );
      let foundEnvio: number | null = null;

      (item.extras ?? []).forEach((ex) => {
        const ep = products.find((p) => p.id === ex.productId);
        if (!ep) return;
        const n = (ep.name || "").toLowerCase();
        if (n.includes("envio") || n.includes("envío")) {
          foundEnvio = ep.id;
        } else if (n.includes("salsa")) {
          initialSlots[0].salsaId = ep.id;
        } else if (n.includes("base")) {
          initialSlots[0].baseId = ep.id;
        } else {
          initialSlots[0].extraIds.push(ep.id);
        }
      });

      if (slotCount === 1) {
        initialSlots[0].note = item.notes ?? "";
      }

      setModalSlots(initialSlots);
      setModalEnvioId(foundEnvio);
    }

    setModifierModalOpen(true);
  };

  // Helpers para modificar el Chilaquil activo dentro del modal
  const updateActiveSlot = (updater: (prev: ChilaquilSlot) => ChilaquilSlot) => {
    setModalSlots((prev) =>
      prev.map((slot, idx) => (idx === activeSlotIdx ? updater(slot) : slot))
    );
  };

  const toggleSlotSalsa = (id: number) => {
    updateActiveSlot((slot) => ({
      ...slot,
      salsaId: slot.salsaId === id ? null : id,
    }));
  };

  const toggleSlotBase = (id: number) => {
    updateActiveSlot((slot) => ({
      ...slot,
      baseId: slot.baseId === id ? null : id,
    }));
  };

  const toggleSlotTopping = (id: number) => {
    updateActiveSlot((slot) => ({
      ...slot,
      extraIds: slot.extraIds.includes(id)
        ? slot.extraIds.filter((x) => x !== id)
        : [...slot.extraIds, id],
    }));
  };

  // Calcula el precio unitario en vivo dentro del modal (Producto + todos los slots + envío)
  const modalUnitPrice = useMemo(() => {
    if (!activeProductForModal) return 0;
    let total = Number(activeProductForModal.salePrice ?? 0);

    modalSlots.forEach((slot) => {
      if (slot.salsaId) {
        const p = products.find((x) => x.id === slot.salsaId);
        if (p) total += Number(p.salePrice ?? 0);
      }
      if (slot.baseId) {
        const p = products.find((x) => x.id === slot.baseId);
        if (p) total += Number(p.salePrice ?? 0);
      }
      slot.extraIds.forEach((id) => {
        const p = products.find((x) => x.id === id);
        if (p) total += Number(p.salePrice ?? 0);
      });
    });

    if (modalEnvioId) {
      const p = products.find((x) => x.id === modalEnvioId);
      if (p) total += Number(p.salePrice ?? 0);
    }

    return total;
  }, [activeProductForModal, modalSlots, modalEnvioId, products]);

  const handleSaveModifierModal = async () => {
    if (!activeProductForModal) return;

    const allExtras: { productId: number }[] = [];
    const slotSummaries: string[] = [];

    modalSlots.forEach((slot, idx) => {
      const parts: string[] = [];

      if (slot.salsaId) {
        allExtras.push({ productId: slot.salsaId });
        const p = products.find((x) => x.id === slot.salsaId);
        if (p) parts.push(p.name.replace(/^extra\s+/i, ""));
      }
      if (slot.baseId) {
        allExtras.push({ productId: slot.baseId });
        const p = products.find((x) => x.id === slot.baseId);
        if (p) parts.push(p.name);
      }
      slot.extraIds.forEach((id) => {
        allExtras.push({ productId: id });
        const p = products.find((x) => x.id === id);
        if (p) parts.push(`+ ${p.name}`);
      });

      const cleanNote = slot.note.trim();
      if (modalSlots.length >= 2) {
        const body =
          parts.length > 0 ? parts.join(", ") : "Sin especificaciones";
        const notePart = cleanNote ? ` (${cleanNote})` : "";
        slotSummaries.push(`Chilaquil ${idx + 1}: ${body}${notePart}`);
      }
    });

    if (modalEnvioId) {
      allExtras.push({ productId: modalEnvioId });
    }

    const finalNotes =
      modalSlots.length >= 2
        ? slotSummaries.join(" | ")
        : modalSlots[0]?.note.trim() ?? "";

   const detailValue = {
      productId: activeProductForModal.id,
      quantity: isComboProduct(activeProductForModal) ? 1 : tempQty,
      extras: allExtras,
      notes: finalNotes,
      ownerType: usaInventarioPorDuenio ? ("PROPIO" as const) : undefined,
      comboSlots: modalSlots,
      comboEnvioId: modalEnvioId,
    };

    if (editingDetailIndex !== null) {
      update(editingDetailIndex, detailValue);
    } else {
      append(detailValue);
    }

    setModifierModalOpen(false);
    setActiveProductForModal(null);
    setEditingDetailIndex(null);
    await trigger("details");
  };

const syncClassicComboDetail = async (
    detailIndex: number,
    nextSlots: ChilaquilSlot[],
    nextEnvioId: number | null
  ) => {
    const allExtras: { productId: number }[] = [];
    const slotSummaries: string[] = [];

    nextSlots.forEach((slot, idx) => {
      const parts: string[] = [];

      if (slot.salsaId) {
        allExtras.push({ productId: slot.salsaId });
        const p = products.find((x) => x.id === slot.salsaId);
        if (p) parts.push(p.name.replace(/^extra\s+/i, ""));
      }
      if (slot.baseId) {
        allExtras.push({ productId: slot.baseId });
        const p = products.find((x) => x.id === slot.baseId);
        if (p) parts.push(p.name);
      }
      slot.extraIds.forEach((id) => {
        allExtras.push({ productId: id });
        const p = products.find((x) => x.id === id);
        if (p) parts.push(`+ ${p.name}`);
      });

      if (nextSlots.length >= 2) {
        const cleanNote = slot.note.trim();
        const body =
          parts.length > 0 ? parts.join(", ") : "Sin especificaciones";
        const notePart = cleanNote ? ` (${cleanNote})` : "";
        slotSummaries.push(`Chilaquil ${idx + 1}: ${body}${notePart}`);
      }
    });

    if (nextEnvioId) {
      allExtras.push({ productId: nextEnvioId });
    }

    const finalNotes =
      nextSlots.length >= 2
        ? slotSummaries.join(" | ")
        : nextSlots[0]?.note.trim() ?? "";

    setValue(`details.${detailIndex}.comboSlots`, nextSlots, {
      shouldDirty: true,
    });
    setValue(`details.${detailIndex}.comboEnvioId`, nextEnvioId, {
      shouldDirty: true,
    });
    setValue(`details.${detailIndex}.extras`, allExtras, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`details.${detailIndex}.notes`, finalNotes, {
      shouldDirty: true,
    });
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
    const slotCount = getComboChilaquilCount(product);
    const esBebida = getProductCategoryName(product)
      .toLowerCase()
      .includes("bebida");

    append({
      productId: product.id,
      quantity: u.min,
      extras: [],
      notes: "",
      ownerType: usaInventarioPorDuenio ? "PROPIO" : undefined,
      comboSlots:
        !esBebida && availableExtras.length > 0
          ? Array.from({ length: slotCount }, () => createEmptySlot())
          : undefined,
      comboEnvioId: null,
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

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderInPortal = (content: ReactNode) => {
    if (!isMounted) return null;
    return createPortal(content, document.body);
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
                const prodExtra = products.find(
                  (p) => p.id === Number(ex.productId)
                );
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
      watch("referenceName")?.trim() || `Ticket - ${dayjs().format("h:mm a")}`;
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

  const suggestedBills = useMemo(() => {
    if (totalVenta <= 0) return [50, 100, 200, 500];
    const nextTen = Math.ceil((totalVenta + 1) / 10) * 10;
    const candidates = [nextTen, 50, 100, 200, 500, 1000].filter(
      (b) => b >= totalVenta
    );
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
          toastError(
            `"${prod.name}" es por ${u.label}, la cantidad debe ser entera.`
          );
          return;
        }
        if (qty < u.min) {
          toastError(
            `Cantidad inválida en "${prod.name}". Mínimo: ${u.min} ${u.label}`
          );
          return;
        }
      } else {
        if (qty < u.min) {
          toastError(
            `Cantidad inválida en "${prod.name}". Mínimo: ${u.min} ${u.label}`
          );
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
        v.clientId === 0 ? v.referenceName?.trim() || `${orderType}` : null,
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
        ...(usaInventarioPorDuenio
          ? { ownerType: d.ownerType ?? "PROPIO" }
          : {}),
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
      paymentMethods?.find((m) => m.name.toUpperCase().includes("EFECTIVO"))
        ?.id ??
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

const activeSlot = modalSlots[activeSlotIdx] ?? createEmptySlot();
  const isModalSweet = activeProductForModal
    ? isSweetProduct(activeProductForModal)
    : false;
  const isModalCombo = activeProductForModal
    ? isComboProduct(activeProductForModal)
    : false;
  const modalToppings = isModalSweet
    ? groupedExtras.sweetToppings
    : groupedExtras.savoryToppings;


  // Sub-render del Panel de Ticket
  const renderTicketPanel = () => (
    <div className="flex flex-col h-full bg-[#2b3035] text-white select-none">
      {/* Cabecera del Ticket */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-[#23272b]">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold tracking-wide">Ticket</h3>
          {fields.length > 0 && (
            <span className="bg-lime-500 text-neutral-950 text-xs font-extrabold px-2 py-0.5 rounded-full">
              {fields.reduce(
                (acc, _, idx) => acc + (Number(details[idx]?.quantity) || 0),
                0
              )}
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
            setOrderType(
              e.target.value as "Comer dentro" | "Para llevar" | "Envío"
            )
          }
          className="bg-transparent text-sm font-semibold text-neutral-200 w-full outline-none cursor-pointer"
        >
          <option value="Envío" className="bg-neutral-800 text-white">
            🛵 Envío a domicilio
          </option>
          <option value="Para llevar" className="bg-neutral-800 text-white">
            🛍️ Para llevar
          </option>
          <option value="Comer dentro" className="bg-neutral-800 text-white">
            🍽️ Comer dentro
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
            const hasComboBreakdown =
              Boolean(item?.notes) && item.notes!.includes("Chilaquil 1:");

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

                  {hasComboBreakdown ? (
                    <div className="mt-1 space-y-1">
                      {item!.notes!.split(" | ").map((line, lineIdx) => (
                        <div
                          key={lineIdx}
                          className="text-[11px] bg-neutral-800/90 border border-neutral-700 rounded px-2 py-1 text-neutral-200 leading-snug"
                        >
                          {line}
                        </div>
                      ))}
                      {item?.comboEnvioId && (
                        <div className="text-[11px] text-sky-300 font-semibold">
                          🛵{" "}
                          {
                            products.find((p) => p.id === item.comboEnvioId)
                              ?.name
                          }
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
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
                    </>
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
        {showTouchCheckout &&
          renderInPortal(
            <div className="fixed inset-0 z-[99999] bg-[#2b3035] text-white flex flex-col md:flex-row overscroll-contain">
              <div className="hidden md:flex md:w-[36%] border-r border-neutral-700 flex-col bg-[#23272b] p-4">
                <div className="text-base font-bold pb-3 border-b border-neutral-700">
                  {watch("referenceName") ||
                    `Ticket - ${dayjs().format("h:mm a")}`}
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
                      <div
                        key={f.id}
                        className="py-2.5 flex justify-between text-sm gap-2"
                      >
                        <div>
                          <div className="font-semibold">
                            {prod.name} x {qty}
                          </div>
                          {item?.notes?.includes("Chilaquil 1:") ? (
                            <div className="text-xs text-neutral-400 space-y-0.5 mt-0.5">
                              {item.notes.split(" | ").map((l, idx) => (
                                <div key={idx}>{l}</div>
                              ))}
                            </div>
                          ) : (
                            names.length > 0 && (
                              <div className="text-xs text-neutral-400">
                                {names.join(", ")}
                              </div>
                            )
                          )}
                        </div>
                        <div className="font-bold shrink-0">
                          ${(unitPrice * qty).toFixed(2)}
                        </div>
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
                      onChange={(e) =>
                        setValue("clientId", Number(e.target.value))
                      }
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
                          if (efectivoMethod)
                            setValue("paymentMethodId", efectivoMethod.id);
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
                          setValue(
                            "changeAmount",
                            Math.max(bill - totalVenta, 0)
                          );
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
        {showTouchReceiptSuccess &&
          lastCompletedSummary &&
          renderInPortal(
            <div className="fixed inset-0 z-[99999] bg-[#2b3035] text-white flex flex-col items-center justify-center p-6 overscroll-contain">
              <div className="max-w-md w-full space-y-8 text-center">
                <div className="grid grid-cols-2 gap-4 border-b border-neutral-700 pb-6">
                  <div>
                    <div className="text-3xl font-extrabold text-white tabular-nums">
                      ${lastCompletedSummary.paid.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      Total pagado
                    </div>
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
                    <span>Categorías</span>
                    <span className="text-neutral-400">›</span>
                    <span className="text-lime-400 truncate">
                      {selectedCategory}
                    </span>
                  </button>
                ) : (
                  <span className="text-sm font-bold text-white px-1">
                    Categorías
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
                      setSelectedCategory(null);
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

            {/* CUERPO PRINCIPAL: CUADRÍCULA PROPORCIONADA DE CATEGORÍAS Y PRODUCTOS */}
            <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar pb-20 md:pb-2.5 flex flex-col">
              {!selectedCategory && !searchTerm.trim() ? (
                dynamicCategories.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
                    No hay categorías disponibles.
                  </div>
                ) : (
                  (() => {
                    const count = dynamicCategories.length;
                    const gridColsClass =
                      count === 1
                        ? "grid-cols-1 sm:grid-cols-2"
                        : count <= 4
                        ? "grid-cols-2"
                        : count <= 6
                        ? "grid-cols-2 sm:grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

                    const isLargeCard = count <= 4;

                    return (
                      <div
                        className={`grid ${gridColsClass} gap-3 content-start`}
                      >
                        {dynamicCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`${cat.color} ${
                              isLargeCard ? "h-36 sm:h-44" : "h-28 sm:h-32"
                            } rounded-xl p-4 flex flex-col justify-between text-left shadow-lg hover:brightness-110 active:scale-[0.98] transition relative overflow-hidden`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span
                                className={`${
                                  isLargeCard
                                    ? "text-xs px-2 py-0.5"
                                    : "text-[10px] px-1.5 py-0.5"
                                } font-extrabold bg-black/25 text-white/95 rounded-md`}
                              >
                                {cat.count}
                              </span>
                              <span
                                className={`text-white/85 ${
                                  isLargeCard ? "text-base" : "text-xs"
                                }`}
                              >
                                📁
                              </span>
                            </div>

                            <div
                              className={`font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] ${
                                isLargeCard
                                  ? "text-lg sm:text-xl lg:text-2xl"
                                  : "text-sm sm:text-base"
                              }`}
                            >
                              {cat.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )
              ) : (
                <div className="flex-1 flex flex-col">
                  {searchTerm.trim() && (
                    <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2 px-1 shrink-0">
                      Resultados para &quot;{searchTerm}&quot;
                    </div>
                  )}

                  {gridProducts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm py-12">
                      No se encontraron productos en esta vista.
                    </div>
                  ) : (
                    (() => {
                      const count = gridProducts.length;
                      const gridColsClass =
                        count <= 2
                          ? "grid-cols-2"
                          : count <= 6
                          ? "grid-cols-2 sm:grid-cols-3"
                          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

                      return (
                        <div
                          className={`grid ${gridColsClass} gap-3 content-start`}
                        >
                          {gridProducts.map((prod) => {
                            const imgUrl = getProductImageUrl(prod);
                            const { tone, icon } = getProductVisuals(prod);
                            const comboCount = getComboChilaquilCount(prod);

                            return (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => handleTouchProductCard(prod)}
                                className={`group relative min-h-[148px] sm:min-h-[164px] rounded-xl overflow-hidden border bg-gradient-to-br ${tone} p-3.5 shadow-lg hover:brightness-110 active:scale-[0.98] transition flex flex-col justify-between text-left`}
                              >
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={prod.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className="absolute right-2 top-2 text-5xl sm:text-6xl opacity-20 group-hover:scale-110 transition-transform pointer-events-none select-none"
                                  >
                                    {icon}
                                  </span>
                                )}

                                {/* Fila superior: Precio + Badge si es combo de 2+ chilaquiles */}
                                <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                                  <span className="text-lg sm:text-xl font-black bg-black/40 text-lime-300 px-2.5 py-0.5 rounded-lg shadow-sm tracking-tight tabular-nums">
                                    ${Number(prod.salePrice ?? 0).toFixed(0)}
                                  </span>
                                  {comboCount >= 2 && (
                                    <span className="text-[11px] font-black bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full shadow">
                                      {comboCount}x 🌮
                                    </span>
                                  )}
                                </div>

                                {/* Fila inferior: Nombre + Descripción */}
                                <div className="relative z-10 mt-auto w-full pt-3 space-y-1">
                                  <div className="text-sm sm:text-base font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                                    {prod.name}
                                  </div>
                                  {prod.description && prod.description.trim() && (
                                    <div className="text-[11px] sm:text-xs font-medium text-white/90 bg-black/25 rounded px-1.5 py-1 leading-snug line-clamp-2">
                                      {prod.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
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
        {mobileTicketDrawerOpen &&
          renderInPortal(
            <div
              className="md:hidden fixed inset-0 z-[99999] bg-black/80 backdrop-blur-[2px] flex flex-col justify-end overscroll-contain"
              onClick={() => setMobileTicketDrawerOpen(false)}
            >
              <div
                className="h-[78vh] w-full bg-[#2b3035] text-white rounded-t-2xl overflow-hidden flex flex-col shadow-2xl border-t border-neutral-600"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 bg-[#1e2226] border-b border-neutral-700 shrink-0">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Detalle del Ticket
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileTicketDrawerOpen(false)}
                    className="text-sm font-bold text-lime-400 bg-neutral-800 px-3 py-1 rounded-md"
                  >
                    ✕ Cerrar
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {renderTicketPanel()}
                </div>
              </div>
            </div>
          )}

        {/* MODAL TÁCTIL DE MODIFICADORES / EXTRAS (1 o múltiples Chilaquiles en Combo) */}
        {modifierModalOpen &&
          activeProductForModal &&
          renderInPortal(
            <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 overscroll-contain">
              <div className="bg-[#343a40] text-white w-full max-w-xl rounded-xl shadow-2xl border border-neutral-600 overflow-hidden flex flex-col max-h-[88vh]">
                {/* Header del Modal */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-600 bg-[#2b3035] shrink-0 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setModifierModalOpen(false)}
                      className="text-neutral-300 hover:text-white text-lg font-bold px-2 py-1 shrink-0"
                    >
                      ✕
                    </button>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm sm:text-base truncate">
                        {activeProductForModal.name}{" "}
                        <span className="text-lime-400 font-black">
                          ${modalUnitPrice.toFixed(2)}
                        </span>
                      </h3>
                      {activeProductForModal.description && (
                        <p className="text-[11px] text-neutral-300 truncate">
                          {activeProductForModal.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveModifierModal}
                    className="bg-[#4caf50] hover:bg-[#43a047] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider px-4 py-2 rounded-md shadow shrink-0 active:scale-95 transition"
                  >
                    GUARDAR
                  </button>
                </div>

                {/* PESTAÑAS POR CHILAQUIL (Solo si el combo tiene 2 o más chilaquiles) */}
                {modalSlots.length >= 2 && (
                  <div className="flex items-center gap-1.5 p-2.5 bg-[#23272b] border-b border-neutral-600 shrink-0 overflow-x-auto">
                    {modalSlots.map((slot, idx) => {
                      const isTabActive = idx === activeSlotIdx;
                      const countSel =
                        (slot.salsaId ? 1 : 0) +
                        (slot.baseId ? 1 : 0) +
                        slot.extraIds.length;
                      const salsaName = slot.salsaId
                        ? (
                            products.find((p) => p.id === slot.salsaId)?.name ??
                            ""
                          ).toLowerCase()
                        : "";
                      const salsaDot = salsaName.includes("verde")
                        ? "bg-emerald-400"
                        : salsaName.includes("roja") ||
                          salsaName.includes("rojo")
                        ? "bg-red-500"
                        : salsaName.includes("combinada")
                        ? "bg-amber-400"
                        : "bg-neutral-500";

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlotIdx(idx)}
                          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition border ${
                            isTabActive
                              ? "bg-[#4caf50] border-lime-300 text-white shadow-md"
                              : "bg-neutral-800 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${salsaDot}`}
                          />
                          <span>Chilaquil {idx + 1}</span>
                          {countSel > 0 && (
                            <span className="bg-black/30 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                              {countSel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cuerpo Scrolleable del Modal */}
              {/* Cuerpo Scrolleable del Modal */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                  {/* 1. SALSA (Solo productos salados / chilaquiles) */}
                  {!isModalSweet && groupedExtras.salsas.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-lime-400 uppercase tracking-wide flex items-center justify-between">
                        <span>
                          🌶️ Salsa{" "}
                          {modalSlots.length >= 2
                            ? `(Chilaquil ${activeSlotIdx + 1})`
                            : ""}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          Elige 1
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {groupedExtras.salsas.map((salsa) => {
                          const isSelected = activeSlot.salsaId === salsa.id;
                          const lower = salsa.name.toLowerCase();
                          const activeColor = lower.includes("verde")
                            ? "bg-emerald-600 border-emerald-300"
                            : lower.includes("roja") || lower.includes("rojo")
                            ? "bg-red-600 border-red-300"
                            : "bg-amber-600 border-amber-300";

                          return (
                            <button
                              key={salsa.id}
                              type="button"
                              onClick={() => toggleSlotSalsa(salsa.id)}
                              className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-center transition active:scale-[0.98] ${
                                isSelected
                                  ? `${activeColor} text-white font-extrabold shadow-md`
                                  : "bg-[#3f464d] border-neutral-500 text-neutral-100 hover:bg-neutral-600"
                              }`}
                            >
                              <span className="text-xs sm:text-sm leading-tight">
                                {salsa.name.replace(/^extra\s+/i, "")}
                              </span>
                              {Number(salsa.salePrice ?? 0) > 0 && (
                                <span className="text-[11px] font-bold mt-0.5">
                                  +${Number(salsa.salePrice).toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. PROTEÍNA BASE (Solo productos salados / chilaquiles) */}
                  {!isModalSweet && groupedExtras.bases.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-lime-400 uppercase tracking-wide flex items-center justify-between">
                        <span>
                          🥩 Proteína{" "}
                          {modalSlots.length >= 2
                            ? `(Chilaquil ${activeSlotIdx + 1})`
                            : ""}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          Elige 1
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {groupedExtras.bases.map((base) => {
                          const isSelected = activeSlot.baseId === base.id;
                          return (
                            <button
                              key={base.id}
                              type="button"
                              onClick={() => toggleSlotBase(base.id)}
                              className={`p-3 rounded-lg border text-left flex items-center justify-between transition active:scale-[0.98] ${
                                isSelected
                                  ? "bg-[#4caf50] border-lime-300 text-white font-bold shadow"
                                  : "bg-[#3f464d] border-neutral-500 text-neutral-100 hover:bg-neutral-600"
                              }`}
                            >
                              <span className="text-xs sm:text-sm leading-tight pr-2">
                                {base.name}
                              </span>
                              <span className="text-xs sm:text-sm font-bold shrink-0">
                                +${Number(base.salePrice ?? 0).toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. EXTRAS / TOPPINGS (Filtrados: dulces para postres, salados para chilaquiles) */}
                  {modalToppings.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-lime-400 uppercase tracking-wide">
                        {isModalSweet
                          ? "🍓 Toppings y Extras"
                          : `🧀 Extras ${
                              modalSlots.length >= 2
                                ? `(Chilaquil ${activeSlotIdx + 1})`
                                : ""
                            }`}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {modalToppings.map((extra) => {
                          const isSelected = activeSlot.extraIds.includes(
                            extra.id
                          );
                          return (
                            <button
                              key={extra.id}
                              type="button"
                              onClick={() => toggleSlotTopping(extra.id)}
                              className={`p-3 rounded-lg border text-left flex items-center justify-between transition active:scale-[0.98] ${
                                isSelected
                                  ? "bg-[#4caf50] border-lime-300 text-white font-bold shadow"
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

                  {/* Comentario */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-bold text-lime-400 uppercase tracking-wide">
                      Comentario{" "}
                      {modalSlots.length >= 2
                        ? `(Chilaquil ${activeSlotIdx + 1})`
                        : ""}
                    </div>
                    <input
                      type="text"
                      placeholder={
                        isModalSweet
                          ? "Ej. Con lechera, mermelada de fresa aparte..."
                          : "Ej. Sin cebolla, bien dorados, poca crema..."
                      }
                      value={activeSlot.note}
                      onChange={(e) =>
                        updateActiveSlot((slot) => ({
                          ...slot,
                          note: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent border-b border-neutral-500 focus:border-lime-400 py-2 text-sm text-white placeholder-neutral-400 outline-none"
                    />
                  </div>

                  {/* 4. ENVÍO A DOMICILIO */}
                  {groupedExtras.envios.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-neutral-600">
                      <div className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                        🛵 Envío a domicilio (opcional)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {groupedExtras.envios.map((envio) => {
                          const isSelected = modalEnvioId === envio.id;
                          return (
                            <button
                              key={envio.id}
                              type="button"
                              onClick={() =>
                                setModalEnvioId(isSelected ? null : envio.id)
                              }
                              className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition active:scale-[0.98] ${
                                isSelected
                                  ? "bg-sky-600 border-sky-300 text-white font-bold shadow"
                                  : "bg-[#3f464d] border-neutral-500 text-neutral-100 hover:bg-neutral-600"
                              }`}
                            >
                              <span className="text-[11px] leading-tight pr-2">
                                {envio.name.replace(
                                  /^extra\s+env[ií]o\s+a\s+domicilio\s*/i,
                                  "Envío "
                                )}
                              </span>
                              <span className="text-xs font-bold shrink-0">
                                +${Number(envio.salePrice ?? 0).toFixed(0)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. CANTIDAD (Oculta en combos para personalizar cada uno por separado) */}
                  {isModalCombo ? (
                    <div className="pt-2 border-t border-neutral-600 text-[11px] text-neutral-400 italic">
                      Cada combo se agrega por separado (1x) para poder
                      personalizarlo distinto y no duplicar el envío.
                    </div>
                  ) : (
                    <div className="space-y-2 pt-3 border-t border-neutral-600">
                      <div className="text-xs font-bold text-lime-400 uppercase tracking-wide">
                        Cantidad
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const u = getUnidadUI(activeProductForModal);
                            setTempQty((prev) =>
                              Math.max(
                                u.min,
                                Number((prev - u.step).toFixed(2))
                              )
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
                            setTempQty(
                              Math.max(0.1, Number(e.target.value) || 1)
                            )
                          }
                          className="flex-1 bg-transparent border-b border-neutral-500 text-center text-lg font-bold py-1.5 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const u = getUnidadUI(activeProductForModal);
                            setTempQty((prev) =>
                              Number((prev + u.step).toFixed(2))
                            );
                          }}
                          className="w-12 h-11 rounded bg-[#3f464d] hover:bg-neutral-600 border border-neutral-500 text-xl font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* MODAL GUARDAR TICKET ABIERTO */}
        {showSaveTicketModal &&
          renderInPortal(
            <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4 overscroll-contain">
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
        {showOpenTicketsListModal &&
          renderInPortal(
            <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4 overscroll-contain">
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
                          <div className="font-bold text-sm text-white">
                            {t.name}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {t.createdAt} • {t.employee}
                          </div>
                          {t.comment && (
                            <div className="text-xs text-amber-300 mt-0.5">
                              {t.comment}
                            </div>
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
                              persistOpenTickets(
                                openTickets.filter((x) => x.id !== t.id)
                              );
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

        {showScanner &&
          renderInPortal(
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center">
              <div className="bg-white text-slate-900 rounded-xl p-4 w-[95%] max-w-md shadow-xl relative">
                <h2 className="text-xl font-semibold mb-3 text-center">
                  Escanear código
                </h2>
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
                      filteredProducts[activeProductIndex] ??
                      filteredProducts[0];
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

          {filteredProducts.length > 0 && (
              <div className="absolute z-20 bg-white border rounded shadow-lg w-full mt-1 max-h-60 overflow-y-auto">
                {filteredProducts.map((p, index) => {
                  const isActive = index === activeProductIndex;
                  const lowerName = (p.name || "").toLowerCase();
                  const isVerde = lowerName.includes("verde");
                  const isRojo = lowerName.includes("rojo");
                  const isPan = lowerName.includes("pan");
                  const isCombo = isComboProduct(p);
                  const comboCount = getComboChilaquilCount(p);

                  let itemClass = "";
                  let subTextClass = "";

                  if (isActive) {
                    itemClass = isVerde
                      ? "bg-green-600 text-white"
                      : isRojo
                      ? "bg-red-600 text-white"
                      : isPan
                      ? "bg-purple-600 text-white"
                      : isCombo
                      ? "bg-amber-600 text-white"
                      : "bg-blue-600 text-white";
                    subTextClass = "text-white/85";
                  } else {
                    itemClass = isVerde
                      ? "bg-green-100 text-green-900 hover:bg-green-200"
                      : isRojo
                      ? "bg-red-100 text-red-900 hover:bg-red-200"
                      : isPan
                      ? "bg-purple-100 text-purple-900 hover:bg-purple-200"
                      : isCombo
                      ? "bg-amber-50 text-amber-950 hover:bg-amber-100"
                      : "bg-white text-slate-900 hover:bg-blue-50";
                    subTextClass = isVerde
                      ? "text-green-700"
                      : isRojo
                      ? "text-red-700"
                      : isPan
                      ? "text-purple-700"
                      : isCombo
                      ? "text-amber-700"
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
                      className={`cursor-pointer px-3 py-2.5 border-b last:border-b-0 transition ${itemClass}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{p.name}</span>
                        {comboCount >= 2 && (
                          <span className="text-[10px] font-extrabold bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded-full shrink-0">
                            {comboCount}x 🌮
                          </span>
                        )}
                      </div>
                      {p.description && p.description.trim() && (
                        <div className={`text-xs italic mt-0.5 ${subTextClass}`}>
                          {p.description}
                        </div>
                      )}
                      <div className={`text-[11px] mt-0.5 ${subTextClass}`}>
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
                const esBebida = getProductCategoryName(prod)
                  .toLowerCase()
                  .includes("bebida");
                const isSweet = isSweetProduct(prod);
                const isCombo = isComboProduct(prod);
                const comboCount = getComboChilaquilCount(prod);
                const usaSelectoresOrdenados =
                  !esBebida && availableExtras.length > 0;

                const itemToppings = isSweet
                  ? groupedExtras.sweetToppings
                  : groupedExtras.savoryToppings;

                const currentSlots: ChilaquilSlot[] = usaSelectoresOrdenados
                  ? details[i]?.comboSlots &&
                    details[i]!.comboSlots!.length === comboCount
                    ? details[i]!.comboSlots!
                    : Array.from({ length: comboCount }, () =>
                        createEmptySlot()
                      )
                  : [];
                const currentEnvioId = details[i]?.comboEnvioId ?? null;

                // Para productos/combos individuales, la tarjeta adopta el color de la salsa elegida
                const singleSalsaName =
                  !isSweet && comboCount === 1 && currentSlots[0]?.salsaId
                    ? (
                        products.find((p) => p.id === currentSlots[0].salsaId)
                          ?.name ?? ""
                      ).toLowerCase()
                    : "";

                const isVerde =
                  !isSweet &&
                  (lowerName.includes("verde") ||
                    singleSalsaName.includes("verde"));
                const isRojo =
                  !isSweet &&
                  (lowerName.includes("rojo") ||
                    singleSalsaName.includes("roja") ||
                    singleSalsaName.includes("rojo"));
                const isCombinada = singleSalsaName.includes("combinada");
                const isPan = lowerName.includes("pan");

                const rowBgClass = isVerde
                  ? "bg-green-50 border-green-300"
                  : isRojo
                  ? "bg-red-50 border-red-300"
                  : isPan || isSweet
                  ? "bg-purple-50 border-purple-200"
                  : isCombinada || isCombo
                  ? "bg-amber-50/80 border-amber-300"
                  : "border-slate-200";

                const titleClass = isVerde
                  ? "text-green-900"
                  : isRojo
                  ? "text-red-900"
                  : isPan || isSweet
                  ? "text-purple-900"
                  : isCombinada || isCombo
                  ? "text-amber-950"
                  : "text-slate-800";

                const u = getUnidadUI(prod);

                return (
                  <div
                    key={f.id}
                    className={`flex flex-col gap-2 border rounded-lg p-3 ${rowBgClass} relative transition-colors`}
                  >
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition p-1"
                      onClick={() => remove(i)}
                      title="Eliminar producto"
                    >
                      ✕
                    </button>

                    {/* Nombre + Badge + Descripción */}
                    <div className="pr-6">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-sm ${titleClass}`}>
                          {prod.name}
                        </span>
                        {comboCount >= 2 && (
                          <span className="text-[10px] font-extrabold bg-amber-400 text-neutral-950 px-1.5 py-0.5 rounded-full">
                            {comboCount}x 🌮
                          </span>
                        )}
                      </div>
                      {prod.description && prod.description.trim() && (
                        <p className="text-xs text-slate-600 italic mt-0.5">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    {/* Cantidad (bloqueada a 1 en combos) y Precio unitario con extras */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          data-no-wheel="true"
                          min={u.min}
                          step={u.step}
                          disabled={isCombo}
                          className={`h-8 text-sm w-20 ${
                            isCombo
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : "bg-white"
                          }`}
                          {...register(`details.${i}.quantity`, {
                            valueAsNumber: true,
                            onChange: async (e) => {
                              if (isCombo) return;
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
                        {isCombo && (
                          <span className="text-[11px] text-slate-500 italic">
                            1x por combo
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-800 text-right">
                        ${precioMostrar.toFixed(2)}
                      </div>
                    </div>

                    {/* ===================================================
                        SELECTORES ORDENADOS (Chilaquiles, Combos o Postres)
                       =================================================== */}
                    {usaSelectoresOrdenados ? (
                      <div className="space-y-2.5 mt-1">
                        {currentSlots.map((slot, sIdx) => {
                          const salsaProd = slot.salsaId
                            ? products.find((p) => p.id === slot.salsaId)
                            : null;
                          const salsaLower = (
                            salsaProd?.name ?? ""
                          ).toLowerCase();

                          const slotBoxTone = salsaLower.includes("verde")
                            ? "bg-green-50/90 border-green-300"
                            : salsaLower.includes("roja") ||
                              salsaLower.includes("rojo")
                            ? "bg-red-50/90 border-red-300"
                            : salsaLower.includes("combinada")
                            ? "bg-amber-50/90 border-amber-300"
                            : "bg-white/90 border-slate-200";

                          const updateThisSlot = (
                            updater: (prev: ChilaquilSlot) => ChilaquilSlot
                          ) => {
                            const nextSlots = currentSlots.map((s, idx) =>
                              idx === sIdx ? updater(s) : s
                            );
                            syncClassicComboDetail(
                              i,
                              nextSlots,
                              currentEnvioId
                            );
                          };

                          const isMulti = comboCount >= 2;

                          return (
                            <div
                              key={sIdx}
                              className={
                                isMulti
                                  ? `border rounded-md p-2.5 space-y-2 ${slotBoxTone}`
                                  : "space-y-2"
                              }
                            >
                              {isMulti && (
                                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-700 flex items-center justify-between">
                                  <span>🌮 Chilaquil {sIdx + 1}</span>
                                  {salsaProd && (
                                    <span className="text-[11px] font-bold">
                                      {salsaProd.name.replace(/^extra\s+/i, "")}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Salsa y Proteína: ocultos para Hotcakes / Postres */}
                              {!isSweet && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {groupedExtras.salsas.length > 0 && (
                                    <select
                                      value={slot.salsaId ?? 0}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateThisSlot((s) => ({
                                          ...s,
                                          salsaId: val > 0 ? val : null,
                                        }));
                                      }}
                                      className="text-xs font-medium border border-slate-300 rounded p-1.5 bg-white text-slate-800 outline-none"
                                    >
                                      <option value={0}>🌶️ Salsa...</option>
                                      {groupedExtras.salsas.map((salsa) => (
                                        <option key={salsa.id} value={salsa.id}>
                                          {salsa.name.replace(/^extra\s+/i, "")}
                                          {Number(salsa.salePrice ?? 0) > 0
                                            ? ` (+$${Number(
                                                salsa.salePrice
                                              ).toFixed(2)})`
                                            : ""}
                                        </option>
                                      ))}
                                    </select>
                                  )}

                                  {groupedExtras.bases.length > 0 && (
                                    <select
                                      value={slot.baseId ?? 0}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        updateThisSlot((s) => ({
                                          ...s,
                                          baseId: val > 0 ? val : null,
                                        }));
                                      }}
                                      className="text-xs font-medium border border-slate-300 rounded p-1.5 bg-white text-blue-800 outline-none"
                                    >
                                      <option value={0}>🥩 Proteína...</option>
                                      {groupedExtras.bases.map((base) => (
                                        <option key={base.id} value={base.id}>
                                          {base.name} (+$
                                          {Number(base.salePrice ?? 0).toFixed(
                                            2
                                          )}
                                          )
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              )}

                              {/* Lista de extras agregados */}
                              {slot.extraIds.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  {slot.extraIds.map((exId, exIdx) => {
                                    const pEx = products.find(
                                      (px) => px.id === exId
                                    );
                                    return (
                                      <div
                                        key={`${exId}-${exIdx}`}
                                        className="flex items-center justify-between text-xs bg-blue-50/80 px-2 py-1 rounded border border-blue-100"
                                      >
                                        <span className="truncate font-medium text-blue-900">
                                          + {pEx?.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-green-700">
                                            ${pEx?.salePrice?.toFixed(2)}
                                          </span>
                                          <button
                                            type="button"
                                            className="text-red-500 font-bold px-1"
                                            onClick={() =>
                                              updateThisSlot((s) => ({
                                                ...s,
                                                extraIds: s.extraIds.filter(
                                                  (_, idx) => idx !== exIdx
                                                ),
                                              }))
                                            }
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Toppings filtrados (dulces para postres, salados para chilaquiles) */}
                              {itemToppings.length > 0 && (
                                <select
                                  defaultValue="0"
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > 0) {
                                      updateThisSlot((s) => ({
                                        ...s,
                                        extraIds: [...s.extraIds, val],
                                      }));
                                      e.target.value = "0";
                                    }
                                  }}
                                  className="text-xs font-medium border border-slate-200 rounded p-1.5 w-full bg-white outline-none"
                                >
                                  <option value="0">
                                    {isSweet
                                      ? "🍓 Añadir topping / extra..."
                                      : isMulti
                                      ? `➕ Añadir extra a Chilaquil ${
                                          sIdx + 1
                                        }...`
                                      : "➕ Añadir extra..."}
                                  </option>
                                  {itemToppings.map((extra) => (
                                    <option key={extra.id} value={extra.id}>
                                      {extra.name} (+$
                                      {Number(extra.salePrice ?? 0).toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Nota a cocina */}
                              <Input
                                type="text"
                                value={slot.note}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateThisSlot((s) => ({
                                    ...s,
                                    note: val,
                                  }));
                                }}
                                placeholder={
                                  isSweet
                                    ? "Notas (ej. Con lechera, mermelada aparte)"
                                    : isMulti
                                    ? `Nota Chilaquil ${
                                        sIdx + 1
                                      } (ej. Sin cebolla)`
                                    : "Notas a cocina (ej. Sin cebolla)"
                                }
                                className="h-8 text-xs italic bg-white"
                              />
                            </div>
                          );
                        })}

                        {/* Envío a domicilio (una sola vez por platillo/combo) */}
                        {groupedExtras.envios.length > 0 && (
                          <select
                            value={currentEnvioId ?? 0}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              syncClassicComboDetail(
                                i,
                                currentSlots,
                                val > 0 ? val : null
                              );
                            }}
                            className="text-xs font-semibold border border-sky-200 rounded p-1.5 w-full bg-sky-50/70 text-sky-900 outline-none"
                          >
                            <option value={0}>
                              🛵 Envío a domicilio (opcional)...
                            </option>
                            {groupedExtras.envios.map((envio) => (
                              <option key={envio.id} value={envio.id}>
                                {envio.name} (+$
                                {Number(envio.salePrice ?? 0).toFixed(2)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      /* Bebidas: solo nota opcional */
                      <Input
                        type="text"
                        placeholder="Notas (ej. Sin azúcar, bien frío)"
                        className="h-8 text-xs italic bg-white/80 mt-1"
                        {...register(`details.${i}.notes`)}
                      />
                    )}
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
              value={watch("paymentMethodId") ?? 0}
              onChange={(e) => {
                const id = Number(e.target.value);
                setValue("paymentMethodId", id, { shouldValidate: true });
                trigger("paymentMethodId");
                const selected = paymentMethods.find((m) => m.id === id);
                const isNowCash = (selected?.name ?? "")
                  .toUpperCase()
                  .includes("EFECTIVO");
                setIsCash(isNowCash);

                if (!isNowCash) {
                  setValue("changeAmount", 0);
                }
              }}
              className="border rounded px-2 py-2 w-full text-sm bg-white text-slate-900"
            >
              <option value={0}>Seleccione método</option>
              {paymentMethods.map((m) => (
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
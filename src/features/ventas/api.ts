import { api } from "@/lib/api";

type OwnerType = "PROPIO" | "CONSIGNACION";
type VentaRowType = "NORMAL" | "CONSOLIDADA";
export type PaymentStatus = "PAGADA" | "PARCIAL" | "PENDIENTE";

export interface VentaItem {
  id: number;

  rowId?: string;
  rowType?: VentaRowType;
  folioDisplay?: string;

  clientName: string;
  saleDate: string;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  amountInWords: string;
  paymentMethodName: string;
  userName: string;
  active: boolean;
  details: VentaDetalleItem[];

  consolidated?: boolean;
  weeklyTicketId?: number | string | null;
  consolidatedAt?: string | null;

  periodStartDate?: string | null;
  periodEndDate?: string | null;
  periodDisplay?: string | null;

  ventaIdsConsolidadas?: number[];
  totalVentasConsolidadas?: number | null;
  totalPaid: number;
  pendingBalance: number;
  paymentStatus: PaymentStatus;
}

interface VentaBackendDTO {
  id: number | null;

  rowId?: string;
  rowType?: VentaRowType;
  folioDisplay?: string;

  clientName: string;
  saleDate: string;
  totalAmount: number;
  changeAmount: number;
  amountPaid: number;
  amountInWords: string;
  userName: string;
  active: boolean;
  paymentName?: string;
  paymentMethodName?: string;
  details?: VentaDetalleItem[];

  consolidated?: boolean;
  weeklyTicketId?: number | string | null;
  consolidatedAt?: string | null;

  periodStartDate?: string | null;
  periodEndDate?: string | null;
  periodDisplay?: string | null;

  ventaIdsConsolidadas?: number[];
  totalVentasConsolidadas?: number | null;
  totalPaid?: number;
  pendingBalance?: number;
  paymentStatus?: PaymentStatus;
}


interface VentaFilterBackendDTO {
  id: number | null;

  rowId?: string;
  rowType?: VentaRowType;
  folioDisplay?: string;

  clientName: string;
  saleDate: string;
  totalAmount: number;
  changeAmount?: number;
  amountPaid?: number;
  amountInWords?: string;
  userName?: string;
  paymentName?: string;
  paymentMethodName?: string;
  details?: VentaDetalleItem[];

  consolidated?: boolean;
  weeklyTicketId?: number | string | null;
  consolidatedAt?: string | null;

  periodStartDate?: string | null;
  periodEndDate?: string | null;
  periodDisplay?: string | null;

  ventaIdsConsolidadas?: number[];
  totalVentasConsolidadas?: number | null;
  active?: boolean;
  totalPaid?: number;
  pendingBalance?: number;
  paymentStatus?: PaymentStatus;
}

interface VentaFilterBackendPage {
  content: VentaFilterBackendDTO[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  number: number;
  size: number;
}
export interface VentaPage {
  content: VentaItem[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  number: number;
  size: number;
}

export interface VentaCreate {
  clientId?: number | null;
  clientName?: string | null;
  saleDate: string;
  paymentMethodId: number;
  amountPaid: number;
  emailList: string[];
  details: {
    productId: number;
    quantity: number;
  }[];
}

export interface VentaSearchFiltro {
  id?: number | string;
  texto?: string;
  clientId?: number;
  userId?: number;
  paymentMethodId?: string | number;
  startDate?: string;
  endDate?: string;
  min?: number;
  max?: number;
  day?: number;
  month?: number;
  year?: number;
  active?: boolean;
  consolidated?: boolean;
  page?: number;
  size?: number;
  username?: string;
  paymentStatus?: PaymentStatus;
}


interface VentaFilterPayloadBackend {
  id?: number | string;
  clienteId?: number;
  userId?: number;
  paymentMethodId?: number;
  startDate?: string;
  endDate?: string;
  min?: number;
  max?: number;
  day?: number;
  month?: number;
  year?: number;
  active?: boolean;
  consolidated?: boolean;
  username?: string;
  paymentStatus?: PaymentStatus;
}

export interface VentaConsolidadaRequest {
  clienteId?: number | null;
  userId?: number | null;
  startDate: string;
  endDate: string;
  ventaIds: number[];
}

export interface VentaConsolidadaProducto {
  productId: number | null;
  productName: string;
  unitAbbr?: string | null;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface VentaConsolidadaResponse {
  clienteId: number;
  clientName: string;
  userId?: number | null;
  userName?: string | null;
  startDate: string;
  endDate: string;
  generatedAt: string;
  ventaIds: number[];
  totalVentas: number;
  productos: VentaConsolidadaProducto[];
  totalAmount: number;
  amountInWords: string;
   weeklyTicketId?: string | null;
  consolidatedAt?: string | null;
}

export interface VentaParams {
  page?: number;
  size?: number;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}
export interface VentaDetalleItem {
  id?: number | string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  codigoBarras: string;
  sku:string;
  businessTypeName: string;
  businessTypeId:number;
  branchId:number;
  branchName:string;
  unitAbbr?: string | null;
  permiteDecimales?: boolean | null;
  unitName?: string | null;
 inventarioOwnerType?:OwnerType;
   usaInventarioPorDuenio: boolean;
}

function buildVentaFilterPayload(
  filtros?: VentaSearchFiltro
): VentaFilterPayloadBackend {
  const paymentMethodId =
    filtros?.paymentMethodId !== undefined &&
    filtros?.paymentMethodId !== null &&
    filtros?.paymentMethodId !== ""
      ? Number(filtros.paymentMethodId)
      : undefined;

  return {
    id: filtros?.id,
    clienteId: filtros?.clientId,
    userId: filtros?.userId,
    paymentMethodId,
    startDate: filtros?.startDate,
    endDate: filtros?.endDate,
    min: filtros?.min,
    max: filtros?.max,
    day: filtros?.day,
    month: filtros?.month,
    year: filtros?.year,
    active: filtros?.active,
    consolidated: filtros?.consolidated,
    username: filtros?.username,
    paymentStatus: filtros?.paymentStatus,
  };
}

// ✅ Listar ventas (GET /ventas)
export async function fetchVentas(
  params?: VentaParams,
  filtros?: VentaSearchFiltro
): Promise<VentaPage> {

const cleanFiltros = Object.fromEntries(
  Object.entries(filtros ?? {}).filter(([, value]) =>
    value !== undefined &&
    value !== null &&
    value !== "" &&
    value !== "NaN" &&
    value !== "null"
  )
);

  const res = await api.get<VentaBackendDTO[]>("/ventas", {
    params: { ...params, ...cleanFiltros },
  });

  const raw = res.data;

const content: VentaItem[] = raw.map((v) => {
  const isConsolidada =
    v.rowType === "CONSOLIDADA" || Boolean(v.consolidated);

  return {
    id: v.id ?? 0,

    rowId:
      v.rowId ??
      (isConsolidada && v.weeklyTicketId
        ? `CON-${v.weeklyTicketId}`
        : `VENTA-${v.id}`),

    rowType: isConsolidada ? "CONSOLIDADA" : "NORMAL",

    folioDisplay:
      v.folioDisplay ??
      (isConsolidada && v.weeklyTicketId
        ? `CON-${v.weeklyTicketId}`
        : String(v.id ?? "")),

    clientName: v.clientName,
    saleDate: v.saleDate,
    totalAmount: v.totalAmount,
    totalPaid: v.totalPaid ?? 0,
    pendingBalance: v.pendingBalance ?? 0,
    paymentStatus: v.paymentStatus ?? "PAGADA",
    changeAmount: v.changeAmount ?? 0,
    amountInWords: v.amountInWords ?? "",
    paymentMethodName: v.paymentMethodName ?? v.paymentName ?? "",
    amountPaid: v.amountPaid ?? 0,
    userName: v.userName ?? "-",
    active: v.active ?? true,
    details: v.details ?? [],

    consolidated: isConsolidada,
    weeklyTicketId: v.weeklyTicketId ?? null,
    consolidatedAt: v.consolidatedAt ?? null,

    periodStartDate: v.periodStartDate ?? null,
    periodEndDate: v.periodEndDate ?? null,
    periodDisplay: v.periodDisplay ?? null,

    ventaIdsConsolidadas: v.ventaIdsConsolidadas ?? [],
    totalVentasConsolidadas: v.totalVentasConsolidadas ?? null,
  };
});


  return {
    content,
    totalPages: 1,
    totalElements: raw.length,
    last: true,
    number: 0,
    size: raw.length,
  };
}


// ✅ Buscar ventas con paginación (POST /ventas/filter)
export async function searchVentasPaginadas(
  filtros: VentaSearchFiltro & { page?: number; size?: number }
): Promise<VentaPage> {
  const { page = 0, size = 10, ...restFiltros } = filtros;

  const res = await api.post<VentaFilterBackendPage>(
    "/ventas/filter",
    buildVentaFilterPayload(restFiltros),
    {
      params: { page, size },
    }
  );

  const raw = res.data;

const content: VentaItem[] = raw.content.map((v) => {
  const isConsolidada =
    v.rowType === "CONSOLIDADA" || Boolean(v.consolidated);

  return {
    id: v.id ?? 0,

    rowId:
      v.rowId ??
      (isConsolidada && v.weeklyTicketId
        ? `CON-${v.weeklyTicketId}`
        : `VENTA-${v.id}`),

    rowType: isConsolidada ? "CONSOLIDADA" : "NORMAL",

    folioDisplay:
      v.folioDisplay ??
      (isConsolidada && v.weeklyTicketId
        ? `CON-${v.weeklyTicketId}`
        : String(v.id ?? "")),

    clientName: v.clientName,
    saleDate: v.saleDate,
    totalAmount: v.totalAmount,
    totalPaid: v.totalPaid ?? 0,
    pendingBalance: v.pendingBalance ?? 0,
    paymentStatus: v.paymentStatus ?? "PAGADA",
    changeAmount: v.changeAmount ?? 0,
    amountInWords: v.amountInWords ?? "",
    paymentMethodName: v.paymentMethodName ?? v.paymentName ?? "",
    amountPaid: v.amountPaid ?? 0,
    userName: v.userName ?? "-",
    active: v.active ?? true,
    details: v.details ?? [],

    consolidated: isConsolidada,
    weeklyTicketId: v.weeklyTicketId ?? null,
    consolidatedAt: v.consolidatedAt ?? null,

    periodStartDate: v.periodStartDate ?? null,
    periodEndDate: v.periodEndDate ?? null,
    periodDisplay: v.periodDisplay ?? null,

    ventaIdsConsolidadas: v.ventaIdsConsolidadas ?? [],
    totalVentasConsolidadas: v.totalVentasConsolidadas ?? null,
  };
});

  return {
    content,
    totalPages: raw.totalPages,
    totalElements: raw.totalElements,
    last: raw.last,
    number: raw.number,
    size: raw.size,
  };
}

interface VentaBackendWithDetails extends VentaBackendDTO {
  details: VentaDetalleItem[];
}

export async function fetchVentaById(id: number): Promise<VentaItem> {
  const res = await api.get<VentaBackendWithDetails>(`/ventas/${id}/detail`);
  const v = res.data;

 return {
  id: v.id ?? 0,
  clientName: v.clientName,
  saleDate: v.saleDate,
  totalAmount: v.totalAmount,
  totalPaid: v.totalPaid ?? 0,
  pendingBalance: v.pendingBalance ?? 0,
  paymentStatus: v.paymentStatus ?? "PAGADA",
  changeAmount: v.changeAmount ?? 0,
  amountPaid: v.amountPaid ?? 0,
  amountInWords: v.amountInWords ?? "",
  paymentMethodName: v.paymentMethodName ?? v.paymentName ?? "",
  userName: v.userName ?? "-",
  active: v.active ?? true,
  details: v.details ?? [],
};
}

export async function createVenta(payload: VentaCreate): Promise<VentaItem> {
  try {
    const res = await api.post<VentaItem>("/ventas", payload);
    return res.data;
  } catch (err: unknown) {
    // Convertimos 'unknown' a un tipo manejable
    const error = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    const backendError = {
      response: {
        data: {
          message:
            error?.response?.data?.message ??
            error?.message ??
            "Error inesperado al crear la venta",
        },
      },
    };

    throw backendError;
  }
}

export async function registrarAbonoVenta(
  ventaId: number,
  payload: VentaPagoRequest
): Promise<VentaPagoResponse> {
  const res = await api.post<VentaPagoResponse>(
    `/ventas/${ventaId}/pagos`,
    payload
  );

  return res.data;
}

export async function obtenerPagosVenta(
  ventaId: number
): Promise<VentaPagoResponse[]> {
  const res = await api.get<VentaPagoResponse[]>(
    `/ventas/${ventaId}/pagos`
  );

  return res.data ?? [];
}

export async function deleteVenta(id: number): Promise<void> {
  await api.delete(`/ventas/${id}`);
}
export interface DevolucionVentaPayload {
  ventaId: number;
  codigoBarras: string;
  cantidad: number;
  motivo: string;
}

export interface VentaPagoRequest {
  amount: number;
  paymentMethodId: number;
  note?: string;
}

export interface VentaPagoResponse {
  id: number;
  ventaId: number;
  amount: number;
  paymentMethodId: number;
  paymentName: string;
  userName?: string;
  paymentDate: string;
  note?: string;
  active: boolean;
}

export async function devolucionVenta(
  payload: DevolucionVentaPayload
): Promise<void> {
  await api.post("/ventas/devolucion", payload);
}


export async function sendVentaTicketByEmail(ventaId: number, emailList: string[]) {
  return api.request({
    url: `/pdf-sender/venta/${ventaId}`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: { emailList }
  });
}

export async function getVentaDetails(ventaId: number): Promise<VentaDetalleItem[]> {
  const res = await api.get<VentaDetalleItem[]>(`/ventas/${ventaId}/detail`);
  return res.data;
}

export async function generarDetalleVentaConsolidada(
  payload: VentaConsolidadaRequest
): Promise<VentaConsolidadaResponse> {
  const res = await api.post<VentaConsolidadaResponse>(
    "/ventas/consolidado/detalle",
    payload
  );

  return res.data;
}

export interface GenerarVentaConsolidadaResponse
  extends VentaConsolidadaResponse {
  weeklyTicketId: string;
  consolidatedAt: string;
}

export async function generarVentaConsolidada(
  payload: VentaConsolidadaRequest
): Promise<GenerarVentaConsolidadaResponse> {
  const res = await api.post<GenerarVentaConsolidadaResponse>(
    "/ventas/consolidado/generar",
    payload
  );

  return res.data;
}

export async function obtenerDetalleVentaConsolidadaPorTicket(
  weeklyTicketId: number | string
): Promise<VentaConsolidadaResponse> {
  const res = await api.get<VentaConsolidadaResponse>(
    `/ventas/consolidado/${weeklyTicketId}/detalle`
  );

  return res.data;
}

export async function sendVentaConsolidadaTicketByEmail(
  weeklyTicketId: string,
  emailList: string[]
) {
  return api.request({
    url: `/pdf-sender/venta-consolidada/${weeklyTicketId}`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: { emailList },
  });
}
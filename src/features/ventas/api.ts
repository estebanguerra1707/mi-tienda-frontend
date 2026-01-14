import { api } from "@/lib/api";

type OwnerType = "PROPIO" | "CONSIGNACION";
export interface VentaItem {
  id: number;
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
}

interface VentaBackendDTO {
  id: number;
  clientName: string;
  saleDate: string;
  totalAmount: number;
  changeAmount:number;
  amountPaid: number;
  amountInWords: string;
  userName: string;
  paymentName?: string;
  paymentMethodName?: string; 
  details?: VentaDetalleItem[];
}


interface VentaFilterBackendDTO {
  id: number;
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
  texto?: string;  
  clientId?: number;
  paymentMethodId?: string;
  startDate?: string;
  endDate?: string;
  min?: number;
  max?: number;
  day?: number;
  month?: number;
  year?: number;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface VentaParams {
  page?: number;
  size?: number;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}
export interface VentaDetalleItem {
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
 inventarioOwnerType?:OwnerType;
   usaInventarioPorDuenio: boolean;

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

const content: VentaItem[] = raw.map((v) => ({
  id: v.id,
  clientName: v.clientName,
  saleDate: v.saleDate,
  totalAmount: v.totalAmount,
  changeAmount: v.changeAmount ?? 0,
  amountInWords: v.amountInWords ?? "",
  paymentMethodName: v.paymentMethodName ?? v.paymentName ?? "",
  amountPaid: v.amountPaid ?? 0,
  userName: v.userName ?? "-",
  active: true,
  details: v.details ?? [],  
}));


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
  const res = await api.post<VentaFilterBackendPage>("/ventas/filter", filtros);
  const raw = res.data;

const content: VentaItem[] = raw.content.map((v) => ({
  id: v.id,
  clientName: v.clientName,
  saleDate: v.saleDate,
  totalAmount: v.totalAmount,
  changeAmount: v.changeAmount ?? 0,
  amountInWords: v.amountInWords ?? "",
  paymentMethodName: v.paymentMethodName ?? v.paymentName ?? "",
  amountPaid: v.amountPaid ?? 0,
  userName: v.userName ?? "-",
  active: true,
  details: v.details ?? [],
}));

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
    id: v.id,
    clientName: v.clientName,
    saleDate: v.saleDate,
    totalAmount: v.totalAmount,
    changeAmount: v.changeAmount ?? 0,
    amountPaid: v.amountPaid ?? 0,
    amountInWords: v.amountInWords ?? "",
    paymentMethodName: v.paymentMethodName ?? v.paymentName ?? "",
    userName: v.userName ?? "-",
    active: true,
    details: v.details,
  };
}

// ✅ Crear una nueva venta (POST /ventas)
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

// ✅ Eliminar una venta (DELETE /ventas/{id})
export async function deleteVenta(id: number): Promise<void> {
  await api.delete(`/ventas/${id}`);
}

// ✅ Registrar devolución (POST /ventas/devolucion)
export interface DevolucionVentaPayload {
  ventaId: number;
  codigoBarras: string;
  cantidad: number;
  motivo: string;
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
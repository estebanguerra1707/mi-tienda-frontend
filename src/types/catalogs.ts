// Tipos comunes para catálogos (categorías, métodos de pago, tipos de negocio, sucursales, etc.)

export interface PaymentMethodItem {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
}

export interface CategoryItem {
  id: number;
  name: string;
  businessTypeId?: number;
  businessTypeName?: string;
  active?: boolean;
}

export interface BusinessTypeItem {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
}

export interface BranchItem {
  id: number;
  name: string;
  businessTypeId: number;
  businessTypeName?: string;
  active?: boolean;
}

export  interface ResumenVenta {
  cliente: string;
  metodoPago: string;
  productos: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  pago: number;
  cambio: number;
  sucursal: string;
}

export interface ConfirmarVentaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resumen: ResumenVenta | null;
  isLoading: boolean;
}
export interface ProductoResumen {
  name: string;
  quantity: number;
  price: number;
}

export interface EnviarTicketModalProps {
  ventaId: number | null;
  open: boolean;
  onClose: () => void;
}


export interface ProductoResumenCompra{
  name: string;
  quantity: number;
  price:number;
}

export interface ResumenCompra{
  proveedor: string;
  sucursal:string;
  metodoPago:string;
  productos: ProductoResumen[];
  total:number;
  pago: number;
  cambio:number;
}

export type UpdateUserPayload = {
  username: string;
  email: string;
  role: string;
  currentPassword?: string;
  newPassword?: string;
};
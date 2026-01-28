export type NavSection =
  | "OPERACION"
  | "CATALOGOS"
  | "ADMIN";

export type NavLabel =
  | "Dashboard"
  | "Productos"
  | "Compras"
  | "Ventas"
  | "Devoluciones"
  | "Reportes"
  | "Categorías"
  | "Usuarios"
  | "Sucursales"
  | "Inventario"
  | "Proveedores"
  | "Clientes";

export type NavItem = {
  to: string;
  label: NavLabel;
  section: NavSection;
  show: boolean;
};
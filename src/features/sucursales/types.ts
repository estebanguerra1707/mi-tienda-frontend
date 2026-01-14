export interface Sucursal {
  id: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  isAlertaStockCritico: boolean;
  businessTypeId: number;
  businessTypeName:string;
  usaInventarioPorDuenio: boolean;
}

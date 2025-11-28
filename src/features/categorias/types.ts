export interface Categoria {
  id: number;
  name: string;
  description?: string | null;
  businessTypeId: number;
  businessTypeName:string;
  isActive:boolean;
  fecha_creacion: string;
}

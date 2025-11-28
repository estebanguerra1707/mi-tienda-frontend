// Page<T> (paginación estilo Spring Data)
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // número de página (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
}
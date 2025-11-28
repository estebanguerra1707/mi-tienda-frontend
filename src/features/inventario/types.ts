export type InventoryItem = {
  id: number;
  productId: number;
  productName?: string;
  branchId: number;
  branchName?: string;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  stockCritico?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type InventoryCreateRequest = {
  productId: number;
  branchId: number;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  stockCritico?: boolean;
};

export type InventoryUpdateRequest = Partial<Pick<
  InventoryItem,
  "quantity" | "minStock" | "maxStock" | "stockCritico"
>>;

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
}

export interface ProductResponse {
  success: boolean;
  data?: Product | Product[];
  message?: string;
  error?: string;
}
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export interface ProductDB {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface StockDB {
  product_id: string;
  count: number;
}

/**
 * Product model used across the app
 */
export interface Product {
  id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  description: string;
}

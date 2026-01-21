 import { Product } from "./product.model";

export interface CartItem {
    cartItemId?: string;  // Unique ID from MockAPI cart entry
    product : Product;
    quantity : number;
    subtotal : number;
}

export interface CheckoutForm {
  name: string;
  mobile: string;
  address: string;
  paymentMode: 'cod' | 'card' | 'upi';
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  productDiscount: number;
  cartLevelDiscount: number;
  total: number;
  userDetails: CheckoutForm;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface StockUpdateRequest {
  stock: number;
}

// export interface StockUpdateResponse {
//   success: boolean;
//   message: string;
//   product: Product;
// }
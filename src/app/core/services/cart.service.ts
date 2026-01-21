import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, catchError, of, switchMap, forkJoin, delay } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';
import { ProductData } from './product-data';
import { ErrorService } from './error.service';

// Interface for API cart item (matches MockAPI structure)
interface CartApiItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  productDiscount: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // TODO: Replace with your MockAPI URL
  private readonly CART_API_URL = 'https://6923ed873ad095fb84720c57.mockapi.io/data/cart';

  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();//this make cart observable to other components

  private currentUserId: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private productData: ProductData,
    private errorService: ErrorService
  ) {
    // Load cart when user logs in
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
        this.loadCartFromApi();
      } else {
        this.currentUserId = null;
        this.cartSubject.next([]);
      }
    });
  }

  /**
   * Load cart from API for current user
   */
  private loadCartFromApi(): void {
    if (!this.currentUserId) return;

    this.http.get<CartApiItem[]>(`${this.CART_API_URL}?userId=${this.currentUserId}`)
      .pipe(
        map(apiItems => this.convertApiToCartItems(apiItems)),
        catchError(error => {
          // Handle 404 - user has no cart items yet (empty cart)
          if (error.status === 404) {
            console.log('[CartService] No cart items found for user, starting with empty cart');
            this.errorService.showError('Your cart is empty');
            return of([]);
          }
          console.error('[CartService] Failed to load cart:', error);
          return of([]);
        })
      )
      .subscribe(cart => {
        this.cartSubject.next(cart);
        console.log('[CartService] Loaded cart from API:', cart);
      });
  }

  /**
   * Convert API response to CartItem format
   */
  private convertApiToCartItems(apiItems: CartApiItem[]): CartItem[] {
    return apiItems.map(item => ({
      cartItemId: item.id,  // Store unique cart item ID for tracking
      product: {
        id: item.productId,
        name: item.productName,
        image: item.productImage,
        price: item.productPrice,
        discount: item.productDiscount,
        category: '',  // Not stored in cart API
        stock: 0,      // Will validate against product API later
        description: ''
      },
      quantity: item.quantity,
      subtotal: item.subtotal
    }));
  }

  /**
   * Convert CartItem to API format
   */
  private convertCartItemToApi(cartItem: CartItem): Omit<CartApiItem, 'id' | 'createdAt'> {
    return {
      userId: this.currentUserId!,
      productId: cartItem.product.id,
      productName: cartItem.product.name,
      productImage: cartItem.product.image,
      productPrice: cartItem.product.price,
      productDiscount: cartItem.product.discount || 0,
      quantity: cartItem.quantity,
      subtotal: cartItem.subtotal
    };
  }

  /**
   * Add product to cart
   */
  addToCart(product: Product, quantity: number = 1): Observable<void> {
    // if (!this.currentUserId) {
    //   console.error('[CartService] No user logged in');
    //   return of(void 0);
    // }

    // Use cached cart items from BehaviorSubject instead of API call
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find(item => item.product.id === product.id);

    if (existingItem && existingItem.cartItemId) {
      const newQuantity = existingItem.quantity + quantity;
      const newSubtotal = product.price * newQuantity;

      // update local state first
      const updatedCart = currentCart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: newQuantity, subtotal: newSubtotal }
          : item
      );
      this.cartSubject.next(updatedCart);

      // Then sync with API
      return this.http.put<CartApiItem>(`${this.CART_API_URL}/${existingItem.cartItemId}`, {
        userId: this.currentUserId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        productDiscount: product.discount || 0,
        quantity: newQuantity,
        subtotal: newSubtotal
      }).pipe(
        tap(() => console.log('[CartService] Cart updated for product:', product.id, 'quantity:', quantity)),
        map(() => void 0),
        catchError(error => {
          console.error('[CartService] Failed to update cart, reverting:', error);
          this.cartSubject.next(currentCart); // Revert on error old data use karot
          // this.loadCartFromApi();  // Fresh reload from API
          return of(void 0);
        })
      );
    } else {
      // New product - add via API
      const newItem = {
        userId: this.currentUserId!,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        productDiscount: product.discount || 0,
        quantity: quantity,
        subtotal: product.price * quantity
      };

      return this.http.post<CartApiItem>(this.CART_API_URL, newItem).pipe(
        tap(apiItem => {
          // Add to local cache with the API-generated ID
          const newCartItem: CartItem = {
            cartItemId: apiItem.id,
            product: product,
            quantity: quantity,
            subtotal: product.price * quantity
          };
          this.cartSubject.next([...currentCart, newCartItem]);
          console.log('[CartService] New item added to cart:', product.id, 'quantity:', quantity);
        }),
        map(() => void 0),
        catchError(error => {
          console.error('[CartService] Failed to add to cart:', error);
          return of(void 0);
        })
      );
    }
  }

  /**
   * Remove item from cart
   */
  removeFromCart(productId: string): Observable<void> {
    if (!this.currentUserId) return of(void 0);

    // Use cached cart items instead of API call
    const currentCart = this.cartSubject.value;
    const item = currentCart.find(i => i.product.id === productId);

    if (!item || !item.cartItemId) {
      console.warn('[CartService] Item not found in cache:', productId);
      return of(void 0);
    }

    //  remove from local state
    const updatedCart = currentCart.filter(i => i.product.id !== productId); //product id not equal to existing product those product only
    this.cartSubject.next(updatedCart);

    // Then sync with API
    return this.http.delete(`${this.CART_API_URL}/${item.cartItemId}`).pipe(
      tap(() => {
        console.log('[CartService] Item removed:', productId);
        this.errorService.showSuccess(`${item.product.name} removed from cart`);
      }),
      map(() => void 0),
      catchError(error => {
        console.error('[CartService] Failed to remove item, reverting:', error);
        this.cartSubject.next(currentCart); // Revert on error
        this.errorService.showError('Failed to remove item from cart');
        // this.loadCartFromApi();  // Fresh reload from API
        return of(void 0);
      })
    );
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): Observable<void> {
    if (!this.currentUserId) return of(void 0);

    // Use cached cart items instead of API call
    const currentCart = this.cartSubject.value;
    const item = currentCart.find(i => i.product.id === productId);

    if (!item || !item.cartItemId) {
      console.warn('[CartService] Item not found in cache:', productId);
      return of(void 0);
    }

    const newSubtotal = item.product.price * quantity;

    // Optimistically update local state
    const updatedCart = currentCart.map(i =>
      i.product.id === productId
        ? { ...i, quantity: quantity, subtotal: newSubtotal }
        : i
    );
    this.cartSubject.next(updatedCart);

    // Then sync with API
    return this.http.put<CartApiItem>(`${this.CART_API_URL}/${item.cartItemId}`, {
      userId: this.currentUserId,
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.image,
      productPrice: item.product.price,
      productDiscount: item.product.discount || 0,
      quantity: quantity,
      subtotal: newSubtotal
    }).pipe(
      tap(() => console.log('[CartService] Quantity updated:', productId, quantity)),
      map(() => void 0),
      catchError(error => {
        console.error('[CartService] Failed to update quantity, reverting:', error);
        this.cartSubject.next(currentCart); // Revert on error
        // this.loadCartFromApi();  // Fresh reload from API
        return of(void 0);
      })
    );
  }

  /**
   * Get cart items as Observable
   */
  getCartItems(): Observable<CartItem[]> {
    return this.cart$;
  }

  /**
   * Get total item count in cart
   */
  getCartCount(): Observable<number> {
    return this.cart$.pipe(
      map(cart => cart.reduce((count, item) => count + item.quantity, 0))
    );
  }

  
    // Calculate subtotal (using original prices)
  
  calculateSubtotal(): number {
    const cart = this.cartSubject.value;
    return cart.reduce((total, item) => total + item.subtotal, 0);
  }

  /**
   * Calculate product-level discount (from product's discount field)
   * Assumes productPrice is the ORIGINAL price (before discount)
   */
  calculateProductLevelDiscount(): number {
    const cart = this.cartSubject.value;
    return cart.reduce((total, item) => {
      const discountPercent = item.product.discount || 0;
      // Direct calculation: price × discount% × quantity
      const discountAmount = (item.product.price * discountPercent / 100) * item.quantity;
      return total + discountAmount;
    }, 0);
  }

  /**
   * Calculate discount based on subtotal (cart-level discount)
   */
  calculateDiscount(subtotal: number): number {
    if (subtotal > 20000) return Math.round(subtotal * 0.20);  // 20% off
    if (subtotal > 5000) return Math.round(subtotal * 0.10);   // 10% off
    return 0;
  }

  /**
   * Calculate final total (subtotal - product discount)
   */
  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const productDiscount = this.calculateProductLevelDiscount();
    return subtotal - productDiscount;
  }

  /**
   * Validate stock availability
   */
  validateStock(): Observable<{ valid: boolean, outOfStockItems: string[] }> {
    return this.productData.getProducts().pipe(
      map(products => {
        const cart = this.cartSubject.value;
        const outOfStock: string[] = [];

        cart.forEach(cartItem => {
          const latestProduct = products.find(p => p.id === cartItem.product.id);
          if (!latestProduct || latestProduct.stock < cartItem.quantity) {
            outOfStock.push(cartItem.product.name);
          }
        });

        return {
          valid: outOfStock.length === 0,
          outOfStockItems: outOfStock
        };
      })
    );
  }

  /**
 * Get progress percentage for discount tier
 */
  getProgressPercentage(amount: number): number {
    if (amount >= 20000) return 100;
    if (amount >= 5000) return 50 + ((amount - 5000) / 15000) * 50;
    return (amount / 5000) * 50;
  }

  /**
   * Get discount message based on amount
   */
  getDiscountMessage(amount: number): string {
    if (amount >= 20000) return '🎉 You unlocked 20% extra discount!';
    if (amount >= 5000) {
      const remaining = 20001 - amount;
      return `Add ₹${remaining.toFixed(0)} more to unlock 20% discount!`;
    }
    const remaining = 5001 - amount;
    return `Add ₹${remaining.toFixed(0)} more to unlock 10% discount!`;
  }

  
  //  Get current discount tier
  
  getCurrentTier(amount: number): 'none' | 'tier1' | 'tier2' {
    if (amount >= 20000) return 'tier2';
    if (amount >= 5000) return 'tier1';
    return 'none';
  }

  /**
   * Clear cart (delete all items for current user)
   */
  clearCart(): Observable<void> {
    if (!this.currentUserId) {
      console.warn('[CartService] clearCart called but no user logged in');
      return of(void 0);
    }

    console.log('[CartService] Clearing cart for userId:', this.currentUserId);

    return this.deleteAllCartItems(0);
  }

  /**
   * Recursively delete all cart items with retry logic
   */
  private deleteAllCartItems(attempt: number): Observable<void> {
    const maxAttempts = 3;

    return this.http.get<CartApiItem[]>(`${this.CART_API_URL}?userId=${this.currentUserId}`)
      .pipe(
        tap(items => console.log(`[CartService] Attempt ${attempt + 1}: Found ${items.length} items to delete`)),
        catchError(error => {
          if (error.status === 404) {
            console.log('[CartService] Cart already empty (404)');
            return of([]);
          }
          console.error('[CartService] Error fetching cart items:', error);
          throw error;
        }),
        switchMap(items => {
          // Base case: No items left
          if (items.length === 0) {
            console.log('[CartService] ✓ All items deleted successfully');
            this.cartSubject.next([]);
            return of(void 0);
          }

          // Max attempts reached
          if (attempt >= maxAttempts) {
            console.error(`[CartService] ✗ Failed to delete all items after ${maxAttempts} attempts. ${items.length} items remaining.`);
            this.cartSubject.next([]);
            return of(void 0);
          }

          console.log('[CartService] Starting deletion of', items.length, 'items');
          
          // Create delete requests for all items
          const deleteRequests = items.map(item => {
            console.log('[CartService] Deleting item:', item.id);
            return this.http.delete(`${this.CART_API_URL}/${item.id}`).pipe(
              tap(() => console.log('[CartService] ✓ Deleted:', item.id)),
              catchError(err => {
                console.error('[CartService] ✗ Failed to delete:', item.id, err);
                return of(null);
              })
            );
          });

          // Execute all deletes in parallel
          return forkJoin(deleteRequests).pipe(
            tap(() => console.log('[CartService] Delete batch completed, waiting before verification...')),
            delay(500), // Wait 500ms for MockAPI to process deletes
            // Recursively check if all items are deleted
            switchMap(() => this.deleteAllCartItems(attempt + 1))
          );
        }),
        catchError(error => {
          console.error('[CartService] Failed to clear cart:', error);
          this.cartSubject.next([]);
          return of(void 0);
        })
      );
  }
}
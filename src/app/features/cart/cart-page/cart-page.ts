import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart.model';
import { GenericTable, TableColumn } from '../../../shared/components/generic-table/generic-table';
import { OrderSummary, OrderSummaryData } from '../../../shared/components/order-summary/order-summary';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, GenericTable, OrderSummary],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.scss']
})
export class CartPage implements OnInit {
  cartItems$!: Observable<CartItem[]>;
  cartItems: CartItem[] = [];
  tableColumns: TableColumn[] = [];

  subtotal = 0;
  productDiscount = 0;  // Product-level discount
  cartLevelDiscount = 0; // Cart-level discount (5K/20K tiers)
  total = 0;

  // Order summary data property (instead of getter)
  orderSummaryData: OrderSummaryData = {
    itemCount: 0,
    subtotal: 0,
    productDiscount: 0,
    cartLevelDiscount: 0,
    total: 0,
    progressPercentage: 0,
    discountMessage: '',
    currentTier: 'none',
    showCheckoutButton: true
  };

  constructor(
    private cartService: CartService,
    private router: Router,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.setupTableColumns();
    this.loadCart();
  }

  /**
   * Define table columns configuration
   */
  private setupTableColumns(): void {
    this.tableColumns = [
      {
        key: 'image',
        label: 'Product',
        type: 'image',
        width: '15%'
      },
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        width: '30%'
      },
      {
        key: 'price',
        label: 'Price',
        type: 'price-with-discount',
        width: '15%'
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'quantity',
        width: '20%'
      },
      {
        key: 'subtotal',
        label: 'Subtotal',
        type: 'price-with-discount',
        width: '15%'
      }
    ];
  }


  // Load cart items and calculate totals

  private loadCart(): void {
    this.cartItems$ = this.cartService.getCartItems();

    this.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
      this.updateOrderSummaryData(); // Update order summary
    });
  }

  // Calculate subtotal, discount, and total
  private calculateTotals(): void {
    this.subtotal = this.cartService.calculateSubtotal();
    this.productDiscount = this.cartService.calculateProductLevelDiscount();
    const afterProductDiscount = this.subtotal - this.productDiscount;
    this.cartLevelDiscount = this.cartService.calculateDiscount(afterProductDiscount);
    this.total = afterProductDiscount - this.cartLevelDiscount;
  }

  // Update order summary data (called after cart changes)
  private updateOrderSummaryData(): void {
    const afterProductDiscount = this.subtotal - this.productDiscount;

    this.orderSummaryData = {
      itemCount: this.cartItems.length,
      subtotal: this.subtotal,
      productDiscount: this.productDiscount,
      cartLevelDiscount: this.cartLevelDiscount,
      total: this.total,
      progressPercentage: this.cartService.getProgressPercentage(afterProductDiscount),
      discountMessage: this.cartService.getDiscountMessage(afterProductDiscount),
      currentTier: this.cartService.getCurrentTier(afterProductDiscount),
      showCheckoutButton: true
    };

    console.log('[CartPage] Order Summary Updated:', this.orderSummaryData);
  }


  // Transform CartItem[] to table data format

  get tableData(): any[] {
    return this.cartItems.map(item => ({
      id: item.cartItemId || item.product.id,  // Use unique cart item ID
      productId: item.product.id,  // Keep productId for operations
      image: item.product.image,
      name: item.product.name,
      price: item.product.price,
      discount: item.product.discount,  // Add discount field
      quantity: item.quantity,
      subtotal: item.subtotal
    }));
  }


  //  Handle quantity change from table

  handleQuantityChange(event: { item: any, quantity: number }): void {
    const productId = event.item.productId || event.item.id;
    this.cartService.updateQuantity(productId, event.quantity).subscribe(() => {
      console.log('[CartPage] Quantity updated');
    });
  }


  //  Handle item removal from table

  removeFromCart(item: any): void {
    const productId = item.productId || item.id;
    this.cartService.removeFromCart(productId).subscribe(() => {
      console.log('[CartPage] Item removed from cart');

    });
  }


  // Proceed to checkout with stock validation

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      return;
    }

    this.loaderService.show();

    // Validate stock before checkout
    this.cartService.validateStock().subscribe(result => {
      this.loaderService.hide();

      if (result.valid) {
        // Stock available - go to checkout
        this.router.navigate(['/checkout']);
      } else {
        // Some items out of stock
        alert(`The following items are out of stock: ${result.outOfStockItems.join(', ')}`);
      }
    });
  }
}

export default CartPage;
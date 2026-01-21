import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrderSummary, OrderSummaryData } from '../../../shared/components/order-summary/order-summary';
import { CartItem, Order as OrderModel } from '../../../core/models/cart.model';
import { CartService } from '../../../core/services/cart.service';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorService } from '../../../core/services/error.service';

export interface CheckoutForm {
  name: string;
  mobile: string;
  address: string;
  paymentMode: 'cod' | 'card' | 'upi';
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OrderSummary, RouterLink],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage implements OnInit {
  checkoutForm!: FormGroup;
  cartItems: CartItem[] = [];

  subtotal = 0;
  productDiscount = 0;
  cartLevelDiscount = 0;
  total = 0;

  // Order summary data property
  orderSummaryData: OrderSummaryData = {
    itemCount: 0,
    subtotal: 0,
    productDiscount: 0,
    cartLevelDiscount: 0,
    total: 0,
    progressPercentage: 0,
    discountMessage: '',
    currentTier: 'none',
    showCheckoutButton: false
  };

  isSubmitting = false;
  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCartData(); // ← Brackets add kele
  }

  private initForm(): void {
    this.checkoutForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      paymentMode: ['cod', Validators.required]
    });
  }

  private loadCartData(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
      this.updateOrderSummaryData(); // Update order summary
    });
  }

  private calculateTotals(): void {
    this.subtotal = this.cartService.calculateSubtotal();
    this.productDiscount = this.cartService.calculateProductLevelDiscount();
    const afterProductDiscount = this.subtotal - this.productDiscount;
    this.cartLevelDiscount = this.cartService.calculateDiscount(afterProductDiscount);
    this.total = afterProductDiscount - this.cartLevelDiscount;
  }

  /**
   * Update order summary data (called after cart changes)
   */
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
      showCheckoutButton: false // Checkout page var button hide
    };

    console.log('[CheckoutPage] Order Summary Updated:', this.orderSummaryData);
  }

  onSubmit() {
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.checkoutForm.value;
    const currentUser = this.authService.getCurrentUserSync();

    if (!currentUser) {
      console.error('No user logged in');
      this.isSubmitting = false;
      return;
    }

    // Create order object
    const orderData = {
      userId: currentUser.id,
      items: this.cartItems,
      subtotal: this.subtotal,
      productDiscount: this.productDiscount,
      cartLevelDiscount: this.cartLevelDiscount,
      total: this.total,
      userDetails: {
        name: formValue.name!,
        mobile: formValue.mobile!,
        address: formValue.address!,
        paymentMode: formValue.paymentMode!
      },
      orderDate: new Date(),
      status: 'pending' as const
    };

    // Create order and navigate
    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        console.log('Order created:', order);

        // Clear cart and then navigate
        this.cartService.clearCart().subscribe({
          next: () => {
            console.log('[CheckoutPage] Cart cleared successfully');
            this.isSubmitting = false;
            this.router.navigate(['/profile']);
            this.errorService.showSuccess('Order placed successfully!');
            // this.router.navigate(['/profile']);
          },
          error: (err) => {
            console.error('[CheckoutPage] Failed to clear cart:', err);
            this.isSubmitting = false;
            // Navigate anyway (order is created)
            this.errorService.showError('Order placed but failed to clear cart.');
            // this.router.navigate(['/profile']);
            // this.router.navigate(['/profile']);
          }
        });
      },
      error: (err) => {
        console.error('Order creation failed:', err);
        this.isSubmitting = false;
        // Error handling add kara
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} is too short`;
    }
    if (field?.hasError('pattern')) {
      return 'Enter a valid 10-digit mobile number';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: any = {
      name: 'Name',
      mobile: 'Mobile',
      address: 'Address'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
export default CheckoutPage;
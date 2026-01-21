import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input() product: any;

  constructor(
    private cartService: CartService,
    private errorService: ErrorService
  ) { }
  //Calculate discounted price from original price and discount percentage

  getDiscountedPrice(): number | null {
    if (!this.product?.discount || !this.product?.price) {
      return null;
    }
    // Calculate: discountedPrice = price * (1 - discount/100)
    return Math.round(this.product.price * (1 - this.product.discount / 100));
  }
  addToCart(): void {
    // Check if product has stock
    // if (this.product.stock === 0) {
    //   this.errorService.showError('Product is out of stock');
    //   return;
    // }

    // Add to cart via service
    this.cartService.addToCart(this.product).subscribe({
      next: () => {
        this.errorService.showSuccess(`${this.product.name} added to cart!`);
        console.log('[ProductCard] Product added to cart:', this.product.id);
      },
      error: (err) => {
        this.errorService.showError('Failed to add to cart');
        console.error('[ProductCard] Error adding to cart:', err);
      }
    });
  }
}
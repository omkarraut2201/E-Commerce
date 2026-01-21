import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductData } from '../../../core/services/product-data';
import { Product } from '../../../core/models/product.model';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { CartService } from '../../../core/services/cart.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCard],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.scss'],
})
export class ProductDetails implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  isLoading = true;
  error: string | null = null;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productData: ProductData,
    private cartService: CartService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    // Get product ID from route params
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        // Scroll to top when loading new product
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadProduct(productId);
      } else {
        this.error = 'Product ID not found';
        this.isLoading = false;
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.productData.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          this.product = product;
          this.loadRelatedProducts(product.category, product.id);
        } else {
          this.error = 'Product not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load product details';
        this.isLoading = false;
        console.error('[ProductDetails] Error:', err);
      }
    });
  }

  loadRelatedProducts(category: string, currentProductId: string): void {
    this.productData.getProductsByCategory(category).subscribe({
      next: (products) => {
        this.relatedProducts = products
          .filter(p => p.id !== currentProductId)
          .slice(0, 4);
      },
      error: (err) => {
        console.error('[ProductDetails] Error loading related products:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  getDiscountedPrice(): number | null {
    if (!this.product?.discount || !this.product?.price) {
      return null;
    }
    return Math.round(this.product.price * (1 - this.product.discount / 100));
  }

  addToCart(): void {
    if (!this.product) return;

    // Check stock availability
    // if (this.product.stock === 0) {
    //   this.errorService.showError('Product is out of stock');
    //   return;
    // }

    // Check if requested quantity is available
    if (this.quantity > this.product.stock) {
      this.errorService.showError(`Only ${this.product.stock} units available`);
      return;
    }

    // Add to cart with specified quantity (single API call)
    this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: () => {
        this.errorService.showSuccess(`${this.quantity} × ${this.product!.name} added to cart!`);
        console.log('[ProductDetails] Added to cart:', this.quantity, 'items');
        this.quantity = 1; // Reset quantity after successful add
      },
      error: (err) => {
        this.errorService.showError('Failed to add to cart');
        console.error('[ProductDetails] Error:', err);
      }
    });
  }
  addToWishlist(): void {
    // TODO: Implement wishlist functionality
    console.log('Add to wishlist:', this.product?.id);
  }

  shareProduct(): void {
    // TODO: Implement share functionality
    console.log('Share product:', this.product?.id);
  }

  notifyMe(): void {
    // TODO: Implement notify me functionality
    console.log('Notify me when available:', this.product?.id);
    alert('You will be notified when this product is back in stock!');
  }
}

export default ProductDetails;

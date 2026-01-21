import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ProductData } from '../../../core/services/product-data';
import { Product } from '../../../core/models/product.model';
import { isSidebarOpen } from '../../../shared/components/header/header';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-productgrid',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './productgrid.html',
  styleUrls: ['./productgrid.scss'],
})
export class Productgrid implements OnInit {
  // Array to store products from service
  products: Product[] = [];
  isLoading = false;
  error: string | null = null;
  selectedCategory = 'All';
  
  // Expose sidebar signal to template
  isSidebarOpen = isSidebarOpen;

  // Inject services
  constructor(
    private productData: ProductData,
    private loaderService: LoaderService
  ) {}

  // Fetch products when component loads
  ngOnInit(): void {
    this.loadProducts();
  }

  // Method to load products from service
  loadProducts(): void {
    this.isLoading = false;
    this.error = null;
    this.loaderService.show();

    this.productData.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.loaderService.hide();
        // console.log('[Productgrid] Loaded products:', products.length);
      },
      error: (err) => {
        this.error = 'Failed to load products';
        this.isLoading = false;
        this.loaderService.hide();
        console.error('[Productgrid] Error:', err);
      }
    });
  }

  // TrackBy function for performance
  trackById(index: number, item: Product): string {
    return item.id;
  }

  // Filter products by category
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.isLoading = true;
    this.error = null;

    if (category === 'All') {
      this.loadProducts();
    } else {
      this.productData.getProductsByCategory(category).subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
          console.log(`[Productgrid] Filtered ${products.length} products for ${category}`);
        },
        error: (err) => {
          this.error = 'Failed to load products';
          this.isLoading = false;
          console.error('[Productgrid] Error:', err);
        }
      });
    }
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      isSidebarOpen.set(false);
    }
  }

  // Close sidebar using signal
  closeSidebar(): void {
    isSidebarOpen.set(false);
  }
}
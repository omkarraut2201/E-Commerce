import { Component, HostListener, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { Product } from '../../../core/models/product.model';
import { ProductData } from '../../../core/services/product-data';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';

// Global signal for sidebar state
export const isSidebarOpen = signal(false);

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  isMenuOpen = false;
  searchQuery = '';
  searchResults: Product[] = [];
  isSearching = false;
  showSearchResults = false;

  currentUser$: Observable<User | null>;
  cartCount$!: Observable<number>;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private productData: ProductData,
    private cartService: CartService
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.setupSearch();
    this.cartCount$ = this.cartService.getCartCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  // Setup search with debounce
  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(query => {
        if (!query.trim()) {
          this.searchResults = [];
          this.isSearching = false;
          return [];
        }
        this.isSearching = true;
        return this.productData.getProducts();
      })
    ).subscribe(products => {
      if (this.searchQuery.trim()) {
        this.searchResults = products.filter(product =>
          product.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      this.isSearching = false;
      this.cdr.detectChanges();
    });
  }
  // Handle search input changes
  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  // clear search 
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }

  closeSearch(): void {
    this.showSearchResults = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  getDiscountedPrice(product: Product): number {
    if (!product.discount) return product.price;
    return Math.round(product.price * (1 - product.discount / 100));
  }
  /**
   * Toggle sidebar open/closed using signal
   */
  toggleSidebar(): void {
    isSidebarOpen.update(value => !value);
  }

  /**
   * Toggle dropdown menu open/closed
   */
  toggleMenu(event: Event): void {
    event.stopPropagation(); // Prevent this click from reaching document listener
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Close dropdown when clicking outside
   * Uses @HostListener to listen for document clicks
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.isMenuOpen) return; // Skip if menu is already closed

    const target = event.target as HTMLElement;

    // Check if click is inside the dropdown or profile button area
    const isInsideDropdown = target.closest('.user-menu-wrapper') !== null;

    if (!isInsideDropdown) {
      this.isMenuOpen = false;
      this.cdr.detectChanges(); // Manually trigger change detection
    }
  }

  /**
   * Logout user and navigate to login page
   */
  logOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.isMenuOpen = false; // Close menu after logout
  }
}

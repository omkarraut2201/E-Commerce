import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Order } from '../../../core/models/cart.model';
import { GenericTable, TableColumn } from '../../../shared/components/generic-table/generic-table';
import { RouterLink } from '@angular/router';
import { LoaderService } from '../../../core/services/loader.service';
import { ErrorService } from '../../../core/services/error.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, GenericTable, RouterLink],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.scss']
})
export class ProfilePage implements OnInit {
  // User data
  user: User | null = null;
  isEditMode = false;
  profileForm!: FormGroup;

  // Display phone with +91 prefix
  get formattedPhone(): string {
    if (!this.user?.phone) return 'Not provided';
    const phone = this.user.phone;
    return phone.startsWith('+91') ? phone : `+91-${phone}`;
  }

  /**
   * Get user initials for avatar
   */
  getInitials(): string {
    if (!this.user?.name) return 'U';
    const nameParts = this.user.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }

  // Order data
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrder: Order | null = null;
  showOrderDetails = false;

  // Table configuration
  orderTableColumns: TableColumn[] = [];
  orderTableData: any[] = [];

  // Filters
  statusFilter = 'all';
  statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Loading states
  isLoadingProfile = true;
  isLoadingOrders = true;
  isSavingProfile = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private orderService: OrderService,
    private loaderService: LoaderService,
    private errorService: ErrorService
  ) { }

  ngOnInit(): void {
    this.initProfileForm();
    this.setupOrderTable();
    this.loadUserProfile();
    this.loadOrders();
  }

  /**
   * Initialize profile form
   */
  private initProfileForm(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^[6-9][0-9]{9}$/)]],
      address: ['', [Validators.minLength(10)]]
    });
  }

  /**
   * Setup order history table columns
   */
  private setupOrderTable(): void {
    this.orderTableColumns = [
      { key: 'id', label: 'Order ID', type: 'text', width: '15%' },
      { key: 'orderDate', label: 'Date', type: 'date', width: '15%' },
      { key: 'itemCount', label: 'Items', type: 'text', width: '10%' },
      { key: 'total', label: 'Total', type: 'currency', width: '15%' },
      { key: 'status', label: 'Status', type: 'badge', width: '15%' },
      { key: 'action', label: 'Details', type: 'action-button', buttonLabel: 'View', width: '15%' }
    ];
  }

  orderItemsColumns: TableColumn[] = [
    { key: 'productImage', label: 'Product', type: 'image', width: '15%' },
    { key: 'productName', label: 'Name', type: 'text', width: '45%' },
    { key: 'quantity', label: 'Quantity', type: 'text', width: '20%' },
    { key: 'subtotal', label: 'Price', type: 'currency', width: '20%' }
  ];

  get orderItemsTableData(): any[] {
    if (!this.selectedOrder) return [];
    return this.selectedOrder.items.map((item, index) => ({
      id: item.cartItemId || `item-${index}`, // ← Unique ID add
      productImage: item.product.image,
      productName: item.product.name,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));
  }

  /**
   * Load user profile
   */
  private loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.user = user;
      this.isLoadingProfile = false;

      if (user) {
        // Populate form with user data
        // Clean phone number - remove +91 prefix if exists
        const cleanPhone = (user.phone || '').replace(/^\+91-?/, '');

        this.profileForm.patchValue({
          name: user.name || '',
          email: user.email || '',
          phone: cleanPhone,
          address: user.address || ''
        });
      }
    });
  }

  /**
   * Load user orders
   */
  private loadOrders(): void {
    this.loaderService.show();
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.orderService.getUserOrders(user.id)
        .subscribe(orders => {
          this.orders = orders;
          this.filteredOrders = orders;
          this.updateOrderTableData();
          this.isLoadingOrders = false;
          this.loaderService.hide();
          // console.log('[ProfilePage] Loaded orders:', orders);
        });
      }
    });
  }

  /**
   * Transform orders to table data format
   */
  private updateOrderTableData(): void {
    this.orderTableData = this.filteredOrders.map(order => ({
      id: order.id,
      orderDate: order.orderDate,
      itemCount: order.items.length,
      total: order.total,
      status: order.status,
      _originalData: order  // Store original order for details
    }));
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    if (this.isEditMode) {
      // Cancel - reset form with clean phone number
      const cleanPhone = (this.user?.phone || '').replace(/^\+91-?/, '');
      this.profileForm.patchValue({
        name: this.user?.name || '',
        email: this.user?.email || '',
        phone: cleanPhone,
        address: this.user?.address || ''
      });
      // Mark form as pristine to disable save button
      this.profileForm.markAsPristine();
    }
    this.isEditMode = !this.isEditMode;
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    if (!this.user) return;

    this.isSavingProfile = true;
    const updatedData = this.profileForm.value;

    this.authService.updateUserProfile(this.user.id, updatedData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isEditMode = false;
        this.isSavingProfile = false;
        // Mark form as pristine after successful save
        this.profileForm.markAsPristine();
        // alert('Profile updated successfully!');
        this.errorService.showSuccess('Profile updated successfully!');

      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.isSavingProfile = false;
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  /**
   * Filter orders by status
   */
  filterOrders(status?: string): void {
    if (status) {
      this.statusFilter = status;
    }
    
    if (this.statusFilter === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.statusFilter);
    }
    this.updateOrderTableData();
  }

  /**
   * Handle order action button click
   */
  handleOrderAction(orderData: any): void {
    this.selectedOrder = orderData._originalData;
    this.showOrderDetails = true;
    // console.log('[ProfilePage] View order:', this.selectedOrder);
  }

  /**
   * Close order details modal
   */
  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  /**
   * Form field validation helpers
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);

    if (field?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
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
}

export default ProfilePage;
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface OrderSummaryData {
  itemCount: number;
  subtotal: number;
  productDiscount: number;
  cartLevelDiscount: number;
  total: number;
  progressPercentage: number;
  discountMessage: string;
  currentTier: 'none' | 'tier1' | 'tier2';
  showCheckoutButton?: boolean;
}

@Component({
  selector: 'app-order-summary',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './order-summary.html',
  styleUrl: './order-summary.scss',
})
export class OrderSummary {
  @Input() data: OrderSummaryData = {
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
  
  @Output() onCheckout = new EventEmitter<void>();

  handleCheckout(): void {
    this.onCheckout.emit();
  }
}

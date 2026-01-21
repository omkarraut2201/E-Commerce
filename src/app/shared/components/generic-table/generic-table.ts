import { CommonModule } from '@angular/common';
import { Component, Input, Output,EventEmitter } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'image' | 'currency' | 'quantity' | 'price-with-discount' | 'discountPrice' | 'date' | 'badge' | 'action-button' | 'custom';
  width?: string;
  buttonLabel?: string;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-table.html',
  styleUrl: './generic-table.scss',
})
export class GenericTable {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() showActions: boolean = true;

  @Output() onQuantityChange = new EventEmitter<{ item: any, quantity: number }>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onAction = new EventEmitter<any>();

  increaseQuantity(item: any): void {
    const newQuantity = item.quantity + 1;
    this.onQuantityChange.emit({ item, quantity: newQuantity });
  }

  decreaseQuantity(item: any): void {
    if (item.quantity > 1) {  // Prevent going below 1
      const newQuantity = item.quantity - 1;
      this.onQuantityChange.emit({ item, quantity: newQuantity });
    }
  }

  deleteItem(item: any): void {
    this.onDelete.emit(item);
  }
  // Handle action button click
  handleActionClick(row: any): void {
    this.onAction.emit(row);
  }
}

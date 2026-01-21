import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ErrorService } from '../../../core/services/error.service';
import { ToastMessage } from '../../../core/models/error.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit, OnDestroy {
  
  @ViewChild('toast') toastRef: any;
  
  private destroy$ = new Subject<void>();

  constructor(
    private errorService: ErrorService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    console.log('[ToastComponent] Initialized');
    
    // Subscribe to toast messages from ErrorService
    this.errorService.toast$
      .pipe(takeUntil(this.destroy$))
      .subscribe((toast: ToastMessage) => {
        console.log('[ToastComponent] Received toast:', toast);
        
        // Convert our toast format to PrimeNG format
        this.messageService.add({
          severity: this.getSeverity(toast.type),
          // summary: this.getSummary(toast.type),
          detail: toast.message,
          life: toast.duration || 3000,
          styleClass: `toast-${toast.type}`
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Map our toast type to PrimeNG severity
   */
  private getSeverity(type: string): string {
    const severityMap: { [key: string]: string } = {
      'success': 'success',
      'error': 'error',
      'warning': 'warn',
      'info': 'info'
    };
    return severityMap[type] || 'info';
  }

  /**
   * Get summary text for toast type
   */
  private getSummary(type: string): string {
    const summaryMap: { [key: string]: string } = {
      'success': '✓ Success',
      'error': '✗ Error',
      'warning': '⚠ Warning',
      'info': 'ℹ Info'
    };
    return summaryMap[type] || 'Notification';
  }
}

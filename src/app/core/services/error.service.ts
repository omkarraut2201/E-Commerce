import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ToastMessage } from '../models/error.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  // ========== STATE ==========
  // Subject that emits toast messages
  private toastSubject = new Subject<ToastMessage>();

  // Expose as Observable (read-only for subscribers)
  toast$: Observable<ToastMessage> = this.toastSubject.asObservable();

  constructor() {
    console.log('[ErrorService] Initialized');
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Show success message
   * @param message - Text to display
   * @param duration - How long to show (default: 3000ms)
   */
  showSuccess(message: string, duration: number = 3000): void {
    console.log('[ErrorService] Success:', message);
    this.emit({
      type: 'success',
      message,
      duration
    });
  }

  /**
   * Show error message
   * @param message - Text to display
   * @param duration - How long to show (default: 5000ms)
   */
  showError(message: string, duration: number = 5000): void {
    console.log('[ErrorService] Error:', message);
    this.emit({
      type: 'error',
      message,
      duration
    });
  }

  /**
   * Show warning message
   * @param message - Text to display
   * @param duration - How long to show (default: 4000ms)
   */
  showWarning(message: string, duration: number = 4000): void {
    console.log('[ErrorService] Warning:', message);
    this.emit({
      type: 'warning',
      message,
      duration
    });
  }

  /**
   * Show info message
   * @param message - Text to display
   * @param duration - How long to show (default: 3000ms)
   */
  showInfo(message: string, duration: number = 3000): void {
    console.log('[ErrorService] Info:', message);
    this.emit({
      type: 'info',
      message,
      duration
    });
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Internal method to emit toast message
   */
  private emit(toast: ToastMessage): void {
    this.toastSubject.next(toast);
  }
}

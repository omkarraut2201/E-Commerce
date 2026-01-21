import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already logged in, redirect to products
  if (authService.isAuthenticated()) {
    // console.log('[NoAuthGuard] User already authenticated, redirecting to products');
    router.navigate(['/products']);
    return false; // Block access to auth pages
  }

  // console.log('[NoAuthGuard] User not authenticated, allowing access to auth pages');
  return true; // Allow access to login page
};
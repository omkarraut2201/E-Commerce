import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login),
    // loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    // loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES),
    canActivate: [noAuthGuard]
  },

  // Protected by authGuard
  {
    path: '',
    loadComponent: () => import('./shared/layouts/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then(r => r.PRODUCTS_ROUTES)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./features/products/product-details/product-details').then(m => m.default),
        canActivate: [authGuard]
      },
      // Add this cart route
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart-page/cart-page').then(m => m.default),
        canActivate: [authGuard]
      },
      {
        path: 'checkout',
        loadChildren: () => import('./features/checkout/checkout.routes').then(m => m.checkoutRoutes)
      },
       {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes)
      },
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  }
];

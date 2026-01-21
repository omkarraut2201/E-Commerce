import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./productgrid/productgrid').then(m => m.Productgrid)
  },
  {
    path: ':id',
    loadComponent: () => import('./product-details/product-details').then(m => m.ProductDetails)
  }
];
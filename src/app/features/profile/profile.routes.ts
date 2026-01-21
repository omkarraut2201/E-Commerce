import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-page/profile-page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  }
];
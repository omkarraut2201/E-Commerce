import { Routes } from "@angular/router";
import { authGuard } from "../../core/guards/auth.guard";

export const checkoutRoutes : Routes = [
    {
        path: '',
        loadComponent: () => import('./checkout-page/checkout-page').then(m => m.CheckoutPage),
        canActivate:[authGuard]
    }
]
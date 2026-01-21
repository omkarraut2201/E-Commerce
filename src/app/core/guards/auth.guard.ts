import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // check if the user is authenticated
    if (authService.isAuthenticated()) {
        // console.log('User authenticated, allowing access');
        return true;
    } else {
        router.navigate(['/login']);
        return false;
    }
}
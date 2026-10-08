import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../models/auth.models';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const expectedRoles = route.data?.['roles'] as UserRole[];
  const userRole = authService.userRole();

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  if (expectedRoles && userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  toastService.error('You do not have access to that area.');
  if (userRole) {
    authService.redirectAfterLogin(userRole);
  } else {
    router.navigate(['/']);
  }
  return false;
};

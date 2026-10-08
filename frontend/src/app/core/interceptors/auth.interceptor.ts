import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  // Exclude external Cloudinary requests from auth headers
  if (req.url.includes('cloudinary.com')) {
    return next(req);
  }

  let authReq = req;
  const token = authService.getRawToken();

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't attempt refresh for auth endpoints (login, register, refresh)
      if (error.status === 401 && !req.url.includes('/api/v1/auth/')) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshAccessToken().pipe(
            switchMap(authRes => {
              isRefreshing = false;
              refreshTokenSubject.next(authRes.accessToken);
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${authRes.accessToken}`
                }
              });
              return next(retryReq);
            }),
            catchError(refreshErr => {
              isRefreshing = false;
              authService.logout(true);
              return throwError(() => refreshErr);
            })
          );
        } else {
          return refreshTokenSubject.pipe(
            filter(newToken => newToken !== null),
            take(1),
            switchMap(newToken => {
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            })
          );
        }
      }

      // Format user-friendly error messages from backend ErrorResponse
      if (error.status === 403) {
        if (token && (token.startsWith('jwt_access_token_') || token.startsWith('social_jwt_token_'))) {
          authService.logout(false);
        } else if (!req.url.includes('/api/v1/orders/has-purchased')) {
          toastService.error('You do not have permission to perform this action.');
        }
      } else if (error.status === 400 || error.status === 409 || (error.status === 404 && req.method !== 'GET' && !req.url.includes('/inventory') && !req.url.includes('/reviews')) || error.status >= 500) {
        const errorMsg = error.error?.message || error.error?.error || (error.status === 0 ? 'Cannot connect to backend server. Please check your network connection.' : error.message);
        // Show validation errors if present
        if (error.error?.fieldErrors && Array.isArray(error.error.fieldErrors)) {
          const detail = error.error.fieldErrors.map((fe: any) => `${fe.field}: ${fe.message}`).join(', ');
          toastService.error(detail || errorMsg);
        } else {
          const isSilentBackgroundReq = req.method === 'GET' && (
            req.url.includes('/notifications') ||
            req.url.includes('/recommendations') ||
            req.url.includes('/inventory') ||
            req.url.includes('/reviews') ||
            req.url.includes('/has-purchased')
          );

          if (!isSilentBackgroundReq && !req.url.includes('/login') && !req.url.includes('/register') && !req.url.includes('/forgot-password')) {
            toastService.error(errorMsg);
          }
        }
      }

      return throwError(() => error);
    })
  );
};

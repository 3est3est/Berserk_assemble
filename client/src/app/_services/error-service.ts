import { inject, Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { ToastService } from './toast-service';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private _router = inject(Router);
  private _toast = inject(ToastService);

  handleError(error: any): Observable<never> {
    if (error) {
      switch (error.status) {
        case 400:
          console.log(error);
          if (error.error === 'Record not found') this._toast.error('Invalid username or password');
          else if (error.error !== '') this._toast.error(error.error);
          else this._toast.error('Bad Request');
          break;
        case 404:
          this._router.navigate(['/not-found']);
          break;
        case 401:
          this._toast.error('Unauthorized');
          break;
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
        case 505:
        case 506:
        case 507:
        case 508:
        case 509:
        case 510:
        case 511:
          const navExtra: NavigationExtras = {
            state: { error: error.error },
          };
          this._router.navigate(['/server-error'], navExtra);
          break;
        default:
          this._toast.error('Something went wrong, please try again later');
          break;
      }
    }
    return throwError(() => error);
  }
}

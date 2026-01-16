import { inject, Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private _router = inject(Router);
  private _snackBar = inject(MatSnackBar);
  private _snackBarConfig: MatSnackBarConfig = {
    verticalPosition: 'top',
    horizontalPosition: 'right',
  };

  handleError(error: any): Observable<never> {
    if (error) {
      switch (error.status) {
        case 400:
          if (error.error === 'Record not found') this._snackBar.open;
          this._snackBar.open('Invalid username or password', 'ok', this._snackBarConfig);
          // this._snackBar.open('bad request', 'ok', this._snackBarConfig);
          break;
        case 404:
          this._router.navigate(['/not-found']);
          break;
        case 401:
          this._snackBar.open('unauthorized', 'ok', this._snackBarConfig);
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
          this._router.navigate(['/server-error']);
          break;
        default:
          this._snackBar.open(
            'some thing went wrong!! , please try again later ',
            'ok',
            this._snackBarConfig
          );
          break;
      }
    }
    return throwError(() => error);
  }
}

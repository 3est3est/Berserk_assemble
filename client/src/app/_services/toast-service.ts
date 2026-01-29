import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private _snackBar = inject(MatSnackBar);

  private readonly _config: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  success(message: string) {
    this._snackBar.open(message, 'OK', {
      ...this._config,
      panelClass: ['toast-success'],
    });
  }

  error(message: string) {
    this._snackBar.open(message, 'OK', {
      ...this._config,
      panelClass: ['toast-error'],
    });
  }

  info(message: string) {
    this._snackBar.open(message, 'OK', {
      ...this._config,
      panelClass: ['toast-info'],
    });
  }

  warning(message: string) {
    this._snackBar.open(message, 'OK', {
      ...this._config,
      panelClass: ['toast-warning'],
    });
  }
}

import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private _messageService = inject(MessageService);

  success(message: string, summary: string = 'Success') {
    this._messageService.add({
      severity: 'success',
      summary: summary,
      detail: message,
      life: 3000,
    });
  }

  error(message: string, summary: string = 'Error') {
    this._messageService.add({
      severity: 'error',
      summary: summary,
      detail: message,
      life: 5000,
    });
  }

  info(message: string, summary: string = 'Information') {
    this._messageService.add({
      severity: 'info',
      summary: summary,
      detail: message,
      life: 3000,
    });
  }

  warning(message: string, summary: string = 'Warning') {
    this._messageService.add({
      severity: 'warn',
      summary: summary,
      detail: message,
      life: 4000,
    });
  }
}

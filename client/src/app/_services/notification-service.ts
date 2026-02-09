import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Notification } from '../_models/notification';
import { WebsocketService } from './websocket-service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _http = inject(HttpClient);
  private _wsService = inject(WebsocketService);
  private _url = environment.baseUrl + '/api/notifications';

  private _notifications = signal<Notification[]>([]);

  public notifications = computed(() => this._notifications());
  public unreadCount = computed(() => this._notifications().filter((n) => !n.is_read).length);

  constructor() {
    this.setupWebsocketSync();
  }

  private setupWebsocketSync() {
    this._wsService.notifications$.subscribe((msg) => {
      // When a new global notification arrives via WS, refresh the history from DB
      // because the DB has the authoritative ID and timestamp.
      if (msg.type) {
        this.getNotifications();
      }
    });
  }

  async getNotifications() {
    try {
      const notifications = await firstValueFrom(this._http.get<Notification[]>(this._url));
      this._notifications.set(notifications);
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  }

  async markAsRead(id: number) {
    try {
      await firstValueFrom(this._http.patch(`${this._url}/${id}/read`, {}));
      this._notifications.update((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  }

  async markAllAsRead() {
    try {
      await firstValueFrom(this._http.patch(`${this._url}/mark-all-read`, {}));
      this._notifications.update((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  }

  async clearAll() {
    try {
      await firstValueFrom(this._http.delete(this._url));
      this._notifications.set([]);
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  }
}

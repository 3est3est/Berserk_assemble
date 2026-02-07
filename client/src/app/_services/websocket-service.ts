import { Injectable, inject, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private _ngZone = inject(NgZone);
  private socket?: WebSocket;
  private notificationSocket?: WebSocket;

  private messageSubject = new Subject<any>();
  private notificationSubject = new Subject<any>();

  public messages$: Observable<any> = this.messageSubject.asObservable();
  public notifications$: Observable<any> = this.notificationSubject.asObservable();

  connect(missionId: number): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//localhost:8000/api/ws/mission/${missionId}`;

    console.log('[WebSocket] Connecting to mission:', url);
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      this._ngZone.run(() => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      });
    };

    this.socket.onopen = () => console.log('[WebSocket] Mission connected');
    this.socket.onclose = () => console.log('[WebSocket] Mission closed');
  }

  connectNotifications(): void {
    const passportJson = localStorage.getItem('passport');
    if (!passportJson) return;

    let token = '';
    try {
      token = JSON.parse(passportJson).token;
    } catch (e) {
      console.error('Failed to parse passport for token', e);
      return;
    }

    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//localhost:8000/api/notifications?token=${token}`;

    if (this.notificationSocket) {
      this.notificationSocket.close();
    }

    console.log('[WebSocket] Connecting to Notifications');
    this.notificationSocket = new WebSocket(url);

    this.notificationSocket.onmessage = (event) => {
      this._ngZone.run(() => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Notification] Received:', data);
          this.notificationSubject.next(data);
        } catch (e) {
          console.error('[Notification] Failed to parse:', e);
        }
      });
    };

    this.notificationSocket.onopen = () => console.log('[Notification] Connected successfully');
    this.notificationSocket.onclose = () => console.log('[Notification] Connection closed');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

  disconnectNotifications(): void {
    if (this.notificationSocket) {
      this.notificationSocket.close();
      this.notificationSocket = undefined;
    }
  }

  sendMessage(type: string, data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    } else {
      console.error('[WebSocket] Cannot send message, socket not open');
    }
  }
}

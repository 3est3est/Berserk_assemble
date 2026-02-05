import { Injectable, inject, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private _ngZone = inject(NgZone);
  private socket?: WebSocket;
  private messageSubject = new Subject<any>();

  public messages$: Observable<any> = this.messageSubject.asObservable();

  connect(missionId: number): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Create socket connection to backend port 8000
    const url = `${protocol}//localhost:8000/api/ws/mission/${missionId}`;

    console.log('[WebSocket] Connecting to:', url);

    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      this._ngZone.run(() => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data);
          this.messageSubject.next(data);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      });
    };

    this.socket.onopen = () => {
      console.log('[WebSocket] Connected successfully');
    };

    this.socket.onclose = (event) => {
      console.log('[WebSocket] Connection closed:', event.reason);
    };

    this.socket.onerror = (error) => {
      console.error('[WebSocket] Error identified:', error);
    };
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
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

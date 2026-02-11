import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, filter, map } from 'rxjs';
import { WebsocketService } from './websocket-service';

export interface PrivateMessage {
  id: number;
  sender_id: number;
  sender_display_name?: string;
  sender_avatar_url?: string;
  receiver_id: number;
  receiver_display_name?: string;
  receiver_avatar_url?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private _http = inject(HttpClient);
  private _ws = inject(WebsocketService);
  private _apiUrl = 'http://localhost:8000/api/messages';

  // Observable to trigger opening a chat with a specific user
  private _openChatSubject = new Subject<{ id: number; display_name: string }>();
  public openChat$ = this._openChatSubject.asObservable();

  openChatWithUser(user: { id: number; display_name: string }) {
    this._openChatSubject.next(user);
  }

  // Observable for new incoming messages
  public incomingMessage$ = this._ws.notifications$.pipe(
    filter((msg) => msg.type === 'private_message'),
    map((msg) => msg.data as PrivateMessage),
  );

  sendMessage(receiverId: number, content: string): Observable<PrivateMessage> {
    return this._http.post<PrivateMessage>(this._apiUrl, { receiver_id: receiverId, content });
  }

  getConversation(withId: number): Observable<PrivateMessage[]> {
    return this._http.get<PrivateMessage[]>(`${this._apiUrl}/conversation/${withId}`);
  }

  getRecentChats(): Observable<PrivateMessage[]> {
    return this._http.get<PrivateMessage[]>(`${this._apiUrl}/recent`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this._http.get<{ count: number }>(`${this._apiUrl}/unread`);
  }

  markAsRead(senderId: number): Observable<void> {
    return this._http.post<void>(`${this._apiUrl}/read/${senderId}`, {});
  }
}

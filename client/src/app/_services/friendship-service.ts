import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FriendshipService {
  private _base_url = environment.baseUrl + '/api/friendship';
  private _http = inject(HttpClient);

  async sendRequest(receiverId: number): Promise<void> {
    const url = `${this._base_url}/request/${receiverId}`;
    await firstValueFrom(this._http.post(url, {}));
  }

  async acceptRequest(requestId: number): Promise<void> {
    const url = `${this._base_url}/accept/${requestId}`;
    await firstValueFrom(this._http.patch(url, {}));
  }

  async rejectRequest(requestId: number): Promise<void> {
    const url = `${this._base_url}/reject/${requestId}`;
    await firstValueFrom(this._http.delete(url));
  }

  async removeFriend(friendId: number): Promise<void> {
    const url = `${this._base_url}/${friendId}`;
    await firstValueFrom(this._http.delete(url));
  }

  async getPendingRequests(): Promise<any[]> {
    const url = `${this._base_url}/pending`;
    return firstValueFrom(this._http.get<any[]>(url));
  }

  async getOnlineUsers(): Promise<any[]> {
    const url = `${this._base_url}/online`;
    return firstValueFrom(this._http.get<any[]>(url));
  }

  async getFriendshipStatus(otherId: number): Promise<string | null> {
    const url = `${this._base_url}/status/${otherId}`;
    const res = await firstValueFrom(this._http.get<{ status: string | null }>(url));
    return res.status;
  }

  async getFriends(): Promise<any[]> {
    return firstValueFrom(this._http.get<any[]>(this._base_url));
  }
}

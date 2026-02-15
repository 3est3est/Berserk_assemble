import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendshipService } from '../_services/friendship-service';
import { ChatService } from '../_services/chat-service';
import { RouterModule } from '@angular/router';
import { ToastService } from '../_services/toast-service';
import { PassportService } from '../_services/passport-service';

// PrimeNG
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './network.html',
  styleUrl: './network.scss',
})
export class Network implements OnInit {
  private _friendship = inject(FriendshipService);
  private _chat = inject(ChatService);
  private _toast = inject(ToastService);
  public _passport = inject(PassportService); // Exposed for template or internal logic

  friends = signal<any[]>([]);
  pendingRequests = signal<any[]>([]);
  onlineUsers = signal<any[]>([]);

  activeTab: 'all' | 'requests' | 'online' = 'all';

  async ngOnInit() {
    this.refreshAll();
  }

  async refreshAll() {
    await Promise.all([this.loadFriends(), this.loadPendingRequests(), this.loadOnlineUsers()]);
  }

  async loadFriends() {
    try {
      this.friends.set(await this._friendship.getFriends());
    } catch (e) {
      console.error(e);
    }
  }

  async loadPendingRequests() {
    try {
      this.pendingRequests.set(await this._friendship.getPendingRequests());
    } catch (e) {
      console.error(e);
    }
  }

  async loadOnlineUsers() {
    try {
      const users = await this._friendship.getOnlineUsers();
      // Filter out self
      const myId = this._passport.data()?.id;
      this.onlineUsers.set(users.filter((u) => u.id !== myId));
    } catch (e) {
      console.error(e);
    }
  }

  async onAccept(id: number) {
    try {
      await this._friendship.acceptRequest(id);
      this.refreshAll();
    } catch (e) {
      console.error('Failed to accept:', e);
    }
  }

  async onReject(id: number) {
    try {
      await this._friendship.rejectRequest(id);
      this.refreshAll();
    } catch (e) {
      console.error('Failed to reject:', e);
    }
  }

  async onRemoveFriend(friend: any) {
    if (!confirm(`Remove ${friend.display_name} from your network?`)) return;
    try {
      await this._friendship.removeFriend(friend.id);
      this.refreshAll();
    } catch (e) {
      console.error('Failed to remove friend:', e);
    }
  }

  openChat(friend: any) {
    this._chat.openChatWithUser({
      id: friend.id || friend.requester_id,
      display_name: friend.display_name || `User ${friend.requester_id}`,
    });
  }
}

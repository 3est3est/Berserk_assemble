import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, PrivateMessage } from '../../_services/chat-service';
import { FriendshipService } from '../../_services/friendship-service';
import { WebsocketService } from '../../_services/websocket-service';
import { getUserIdFromToken } from '../../_helpers/util';
import { Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';

type ChatTab = 'recent' | 'friends' | 'explore';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './private-chat.html',
  styleUrl: './private-chat.scss',
})
export class PrivateChat implements OnInit, OnDestroy {
  private _chatService = inject(ChatService);
  private _friendshipService = inject(FriendshipService);
  private _wsService = inject(WebsocketService);
  private _cdr = inject(ChangeDetectorRef);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  isOpened = signal(false);
  unreadCount = signal(0);
  currentUserId = 0;
  selectedUser: any = null;
  messages: PrivateMessage[] = [];

  // Tab state
  activeTab: ChatTab = 'recent';

  // Data
  recentChats: any[] = [];
  friends: any[] = [];
  onlineNonFriends: any[] = [];
  friendIds = new Set<number>();
  onlineUserIds = signal<number[]>([]);

  // Search
  searchQuery = '';
  searchResults: any[] = [];

  newMessage = '';

  private subs = new Subscription();

  ngOnInit() {
    const passportJson = localStorage.getItem('passport');
    const token = passportJson ? JSON.parse(passportJson).token : '';
    this.currentUserId = getUserIdFromToken(token) || 0;

    setTimeout(() => {
      this.loadAll();
    });

    // Listen for external open chat requests (e.g. from Profile page)
    this.subs.add(
      this._chatService.openChat$.subscribe((user) => {
        setTimeout(() => {
          this.isOpened.set(true);
          this.selectedUser = user;
          this.loadMessages(user.id);
        });
      }),
    );

    // Listen for incoming messages
    this.subs.add(
      this._chatService.incomingMessage$.subscribe((msg) => {
        if (
          this.isOpened() &&
          this.selectedUser &&
          (msg.sender_id === this.selectedUser.id || msg.receiver_id === this.selectedUser.id)
        ) {
          const exists = this.messages.some((m) => m.id === msg.id);
          if (!exists) {
            this.messages.push(msg);
            this.scrollToBottom();
          }
          if (msg.receiver_id === this.currentUserId) {
            this.markAsRead(this.selectedUser.id);
          }
        } else {
          if (msg.receiver_id === this.currentUserId) {
            this.updateUnreadCount();
            this.loadRecentChats();
          }
        }
      }),
    );

    // Real-time online status
    this.subs.add(
      this._wsService.notifications$.subscribe((msg: any) => {
        if (msg.type === 'agent_online' || msg.type === 'agent_offline') {
          this.loadAll();
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  async loadAll() {
    await Promise.all([this.loadFriendsAndOnline(), this.loadRecentChats()]);
    this.updateUnreadCount();
  }

  async loadFriendsAndOnline() {
    try {
      const [friends, onlineUsers] = await Promise.all([
        this._friendshipService.getFriends(),
        this._friendshipService.getOnlineUsers(),
      ]);

      this.friendIds = new Set(friends.map((f: any) => f.id));
      const onlineIds = onlineUsers.map((u: any) => u.id);
      this.onlineUserIds.set(onlineIds);

      this.friends = friends.map((f: any) => ({
        ...f,
        is_online: onlineIds.includes(f.id),
      }));

      // Online users who are NOT friends and NOT self
      this.onlineNonFriends = onlineUsers.filter(
        (u: any) => !this.friendIds.has(u.id) && u.id !== this.currentUserId,
      );

      this._cdr.markForCheck();
    } catch (e) {
      console.error('Failed to load friends/online', e);
    }
  }

  loadRecentChats() {
    this._chatService.getRecentChats().subscribe((chats) => {
      this.recentChats = chats.map((c) => {
        const isMeSender = c.sender_id === this.currentUserId;
        const otherId = isMeSender ? c.receiver_id : c.sender_id;
        const otherName = isMeSender ? c.receiver_display_name : c.sender_display_name;
        const otherAvatar = isMeSender ? c.receiver_avatar_url : c.sender_avatar_url;

        return {
          ...c,
          other_id: otherId,
          other_name: otherName || `User ${otherId}`,
          other_avatar: otherAvatar,
          is_online: this.onlineUserIds().includes(otherId),
        };
      });
      this._cdr.markForCheck();
    });
  }

  updateUnreadCount() {
    this._chatService.getUnreadCount().subscribe((data) => {
      this.unreadCount.set(data.count);
    });
  }

  // Search across friends + online non-friends
  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    const allPeople = [...this.friends, ...this.onlineNonFriends];
    const seen = new Set<number>();
    this.searchResults = allPeople.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return p.display_name.toLowerCase().includes(q) || p.id.toString().includes(q);
    });
  }

  toggleChat() {
    this.isOpened.update((val) => !val);
    if (this.isOpened()) {
      this.searchQuery = '';
      this.searchResults = [];
      if (this.selectedUser) {
        this.markAsRead(this.selectedUser.id);
        this.scrollToBottom();
      }
      this.loadAll();
    }
  }

  startChat(user: any) {
    this.selectedUser = {
      id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    };
    this.searchQuery = '';
    this.searchResults = [];
    this.loadMessages(user.id);
    this.isOpened.set(true);
  }

  selectChat(chat: any) {
    const otherId = chat.sender_id === this.currentUserId ? chat.receiver_id : chat.sender_id;
    this.selectedUser = {
      id: otherId,
      display_name: chat.other_name,
      avatar_url: chat.other_avatar,
    };
    this.loadMessages(otherId);
  }

  closeChat() {
    if (this.selectedUser) {
      this.selectedUser = null;
      this.messages = [];
      this.loadRecentChats();
    } else {
      this.isOpened.set(false);
    }
  }

  loadMessages(otherId: number) {
    this._chatService.getConversation(otherId).subscribe((msgs) => {
      this.messages = msgs;
      this.scrollToBottom();
      this.markAsRead(otherId);
    });
  }

  send() {
    if (!this.newMessage.trim() || !this.selectedUser) return;

    const tempMsg: any = {
      id: -1,
      sender_id: this.currentUserId,
      receiver_id: this.selectedUser.id,
      content: this.newMessage,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    this.messages.push(tempMsg);
    this.scrollToBottom();
    const payload = this.newMessage;
    this.newMessage = '';

    this._chatService.sendMessage(this.selectedUser.id, payload).subscribe((msg) => {
      this.messages = this.messages.filter((m) => m.id !== -1);
      const exists = this.messages.some((m) => m.id === msg.id);
      if (!exists) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
      this.loadRecentChats();
      this._cdr.detectChanges();
    });
  }

  markAsRead(senderId: number) {
    this._chatService.markAsRead(senderId).subscribe(() => {
      this.updateUnreadCount();
    });
  }

  async unfriendCurrent() {
    if (!this.selectedUser || !confirm(`Remove ${this.selectedUser.display_name} from friends?`))
      return;

    try {
      await this._friendshipService.removeFriend(this.selectedUser.id);
      this.closeChat();
      this.loadAll();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  }

  isFriend(userId: number): boolean {
    return this.friendIds.has(userId);
  }

  get onlineFriends(): any[] {
    return this.friends.filter((f) => f.is_online);
  }

  get offlineFriends(): any[] {
    return this.friends.filter((f) => !f.is_online);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}

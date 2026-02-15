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
import { getUserIdFromToken } from '../../_helpers/util';
import { Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-private-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './private-chat.html',
  styleUrl: './private-chat.scss',
})
export class PrivateChat implements OnInit, OnDestroy {
  private _chatService = inject(ChatService);
  private _cdr = inject(ChangeDetectorRef);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  isOpened = signal(false);
  unreadCount = signal(0);
  currentUserId = 0;
  selectedUser: any = null;
  messages: PrivateMessage[] = [];
  recentChats: any[] = [];
  newMessage = '';

  // New features: Searching and starting chats
  private _friendshipService = inject(FriendshipService);
  friends: any[] = [];
  searchQuery = '';
  filteredFriends: any[] = [];

  private subs = new Subscription();

  ngOnInit() {
    const passportJson = localStorage.getItem('passport');
    const token = passportJson ? JSON.parse(passportJson).token : '';
    this.currentUserId = getUserIdFromToken(token) || 0;

    // Wrap initial data loading in setTimeout to avoid ExpressionChanged error
    setTimeout(() => {
      this.loadRecentChats();
      this.updateUnreadCount();
      this.loadFriends();
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
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  toggleChat() {
    this.isOpened.update((val) => !val);
    this.searchQuery = '';
    this.filteredFriends = [];
    if (this.isOpened()) {
      setTimeout(() => {
        this.loadFriends();
        if (this.selectedUser) {
          this.markAsRead(this.selectedUser.id);
          this.scrollToBottom();
        } else {
          this.loadRecentChats();
        }
      });
    }
  }

  loadFriends() {
    this._friendshipService.getFriends().then((friends) => {
      this.friends = friends;
      this._cdr.markForCheck();
    });
  }

  onSearchChange() {
    if (!this.searchQuery.trim()) {
      this.filteredFriends = [];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredFriends = this.friends.filter(
      (f) => f.display_name.toLowerCase().includes(q) || f.id.toString().includes(q),
    );
  }

  startNewChat(friend: any) {
    this.selectedUser = friend;
    this.searchQuery = '';
    this.filteredFriends = [];
    this.loadMessages(friend.id);
    this.isOpened.set(true);
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

  loadRecentChats() {
    this._chatService.getRecentChats().subscribe((chats) => {
      this.recentChats = chats.map((c) => {
        const isMeSender = c.sender_id === this.currentUserId;
        const otherName = isMeSender ? c.receiver_display_name : c.sender_display_name;
        const otherAvatar = isMeSender ? c.receiver_avatar_url : c.sender_avatar_url;

        return {
          ...c,
          other_name: otherName || `User ${isMeSender ? c.receiver_id : c.sender_id}`,
          other_avatar: otherAvatar,
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

  selectChat(chat: any) {
    const otherId = chat.sender_id === this.currentUserId ? chat.receiver_id : chat.sender_id;
    this.selectedUser = { id: otherId, display_name: chat.other_name };
    this.loadMessages(otherId);
  }

  loadMessages(otherId: number) {
    this._chatService.getConversation(otherId).subscribe((msgs) => {
      this.messages = msgs;
      this.scrollToBottom(); // Scroll after loading
      this.markAsRead(otherId);
    });
  }

  send() {
    if (!this.newMessage.trim() || !this.selectedUser) return;

    // Optimistic UI update: Show msg immediately
    const tempMsg: any = {
      id: -1, // Temp ID
      sender_id: this.currentUserId,
      receiver_id: this.selectedUser.id,
      content: this.newMessage,
      sent_at: new Date().toISOString(),
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
    if (
      !this.selectedUser ||
      !confirm(
        `Unfriend ${this.selectedUser.display_name}? This will remove them from your contacts.`,
      )
    )
      return;

    try {
      await this._friendshipService.removeFriend(this.selectedUser.id);
      this.closeChat();
      this.loadFriends();
      this.loadRecentChats();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
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

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../_services/notification-service';
import { FriendshipService } from '../../_services/friendship-service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit {
  public notificationService = inject(NotificationService);
  private friendshipService = inject(FriendshipService);

  ngOnInit() {
    this.notificationService.getNotifications();
  }

  // ... (keep onNotificationClick)

  async acceptFriendRequest(notif: any) {
    if (!notif.related_id) return;
    try {
      const pending = await this.friendshipService.getPendingRequests();
      const req = pending.find((r) => r.requester_id === notif.related_id);
      if (req) {
        await this.friendshipService.acceptRequest(req.id);
        this.notificationService.markAsRead(notif.id);
        // alert('Request accepted!');
      } else {
        console.error('Request not found or already processed');
      }
    } catch (e) {
      console.error('Failed to accept request', e);
    }
  }

  onNotificationClick(notification: any) {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'friend_request':
        return 'person_add';
      case 'friend_accepted':
        return 'check_circle';
      case 'mission_started':
        return 'play_circle';
      // ...
      case 'new_crew_joined':
        return 'person_add';
      case 'kicked_from_mission':
        return 'person_remove';
      case 'mission_completed':
        return 'check_circle';
      case 'mission_failed':
        return 'cancel';
      case 'new_chat_message':
        return 'chat';
      case 'mission_deleted':
        return 'delete_sweep';
      case 'crew_left':
        return 'exit_to_app';
      case 'private_message':
        return 'person_pin';
      default:
        return 'notifications';
    }
  }
}

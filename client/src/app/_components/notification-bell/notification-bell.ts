import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../_services/notification-service';
import { FriendshipService } from '../../_services/friendship-service';

// PrimeNG
import { PopoverModule } from 'primeng/popover';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, PopoverModule, BadgeModule, ButtonModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit {
  public notificationService = inject(NotificationService);
  private friendshipService = inject(FriendshipService);

  ngOnInit() {
    this.notificationService.getNotifications();
  }

  async acceptFriendRequest(notif: any) {
    if (!notif.related_id) return;
    try {
      const pending = await this.friendshipService.getPendingRequests();
      const req = pending.find((r: any) => r.requester_id === notif.related_id);
      if (req) {
        await this.friendshipService.acceptRequest(req.id);
        this.notificationService.markAsRead(notif.id);
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
        return 'pi pi-user-plus';
      case 'friend_accepted':
        return 'pi pi-check-circle';
      case 'mission_started':
        return 'pi pi-play';
      case 'new_crew_joined':
        return 'pi pi-user-plus';
      case 'kicked_from_mission':
        return 'pi pi-user-minus';
      case 'mission_completed':
        return 'pi pi-verified';
      case 'mission_failed':
        return 'pi pi-times-circle';
      case 'new_chat_message':
        return 'pi pi-comment';
      case 'mission_deleted':
        return 'pi pi-trash';
      case 'crew_left':
        return 'pi pi-sign-out';
      case 'private_message':
        return 'pi pi-envelope';
      default:
        return 'pi pi-bell';
    }
  }
}

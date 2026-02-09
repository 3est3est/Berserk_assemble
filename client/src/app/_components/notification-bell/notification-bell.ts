import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../_services/notification-service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit {
  public notificationService = inject(NotificationService);

  ngOnInit() {
    this.notificationService.getNotifications();
  }

  onNotificationClick(notification: any) {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'mission_started':
        return 'play_circle';
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
      default:
        return 'notifications';
    }
  }
}

import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { PassportService } from './_services/passport-service';
import { WebsocketService } from './_services/websocket-service';
import { ToastService } from './_services/toast-service';
import { NotificationService } from './_services/notification-service';

import { CommonModule } from '@angular/common';
import { PrivateChat } from './_components/private-chat/private-chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, PrivateChat, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Berserk Assemble');

  public _passport = inject(PassportService);
  private _ws = inject(WebsocketService);
  private _toast = inject(ToastService);
  private _router = inject(Router);
  private _notifService = inject(NotificationService);

  constructor() {
    // Auto-connect/disconnect notifications based on login state
    effect(() => {
      if (this._passport.isSignin()) {
        this._ws.connectNotifications();
        this._notifService.getNotifications();
      } else {
        this._ws.disconnectNotifications();
      }
    });

    // Listen to global notifications
    this._ws.notifications$.subscribe((msg) => {
      this.handleNotification(msg);
    });
  }

  private handleNotification(msg: any) {
    console.log('🔔 Received notification:', msg);

    // Check if user is currently in the mission room
    const currentUrl = this._router.url;
    const isInMissionRoom = currentUrl.includes('/missions/') && msg.data?.mission_id;
    const currentMissionId = isInMissionRoom ? parseInt(currentUrl.split('/missions/')[1]) : null;

    console.log(
      'Current URL:',
      currentUrl,
      'Current Mission ID:',
      currentMissionId,
      'Notification Mission ID:',
      msg.data?.mission_id,
    );

    const data = msg.data || {};
    let type = msg.type;

    // If it's a generic notification, extract the specific type from data
    if (type === 'notification' && data.type) {
      type = data.type;
    }

    console.log(`[Notification] Processing type: ${type}`, data);

    switch (type) {
      case 'new_crew_joined':
        this._toast.success(`New crew joined mission: ${data.mission_name}`);
        break;
      case 'mission_started':
        this._toast.info(`Mission "${data.mission_name}" has started! Time to fight!`);
        break;
      case 'kicked_from_mission':
        if (currentMissionId !== data.mission_id) {
          this._toast.warning(`You were kicked from: ${data.mission_name}`);
        }
        break;
      case 'new_chat_message':
        // No toast - handled by notification bell & badge
        break;
      case 'mission_deleted':
        if (currentMissionId !== data.mission_id) {
          this._toast.warning(`Mission "${data.mission_name}" has been removed by the chief.`);
        }
        break;
      case 'crew_left':
        if (currentMissionId !== data.mission_id) {
          this._toast.info(`A crew member left mission: ${data.mission_name}`);
        }
        break;
      case 'private_message':
        // No toast - handled by notification bell & badge
        break;
      case 'agent_online':
      case 'agent_offline':
        // Silently handle or minor log
        break;
      default:
        console.warn('Unknown notification type:', type);
    }
  }
}

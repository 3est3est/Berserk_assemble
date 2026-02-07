import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { PassportService } from './_services/passport-service';
import { WebsocketService } from './_services/websocket-service';
import { ToastService } from './_services/toast-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Berserk Assemble');

  private _passport = inject(PassportService);
  private _ws = inject(WebsocketService);
  private _toast = inject(ToastService);
  private _router = inject(Router);

  constructor() {
    // Auto-connect/disconnect notifications based on login state
    effect(() => {
      if (this._passport.isSignin()) {
        this._ws.connectNotifications();
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

    switch (msg.type) {
      case 'new_crew_joined':
        this._toast.success(`New crew joined mission: ${msg.data.mission_name}`);
        break;
      case 'mission_started':
        this._toast.info(`Mission "${msg.data.mission_name}" has started! Time to fight!`);
        break;
      case 'kicked_from_mission':
        if (currentMissionId !== msg.data.mission_id) {
          this._toast.warning(`You were kicked from: ${msg.data.mission_name}`);
        }
        break;
      case 'new_chat_message':
        // Don't show toast if user is already in that mission's chat room
        if (currentMissionId !== msg.data.mission_id) {
          this._toast.success(
            `[${msg.data.mission_name}] ${msg.data.sender_name}: "${msg.data.content}"`,
          );
        } else {
          console.log('⏭️ Skipping toast - user is in the mission room');
        }
        break;
      case 'mission_deleted':
        console.log('🗑️ Mission deleted notification received');
        if (currentMissionId !== msg.data.mission_id) {
          this._toast.warning(`Mission "${msg.data.mission_name}" has been removed by the chief.`);
        }
        break;
      case 'crew_left':
        if (currentMissionId !== msg.data.mission_id) {
          this._toast.info(`A crew member left mission: ${msg.data.mission_name}`);
        }
        break;
      default:
        console.warn('Unknown notification type:', msg.type);
    }
  }
}

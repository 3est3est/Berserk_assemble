import { Component, inject, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FriendshipService } from '../../_services/friendship-service';
import { WebsocketService } from '../../_services/websocket-service';
import { PassportService } from '../../_services/passport-service';

// PrimeNG
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-online-users',
  standalone: true,
  imports: [CommonModule, RouterModule, PopoverModule, ButtonModule],
  templateUrl: './online-users.html',
  styleUrl: './online-users.scss',
})
export class OnlineUsers implements OnInit, OnDestroy {
  private _friendship = inject(FriendshipService);
  private _wsService = inject(WebsocketService);
  private _passport = inject(PassportService);
  private _cdr = inject(ChangeDetectorRef);

  onlineUsers = signal<any[]>([]);
  private _wsSubscription?: Subscription;

  ngOnInit() {
    this.loadOnlineUsers();
    this.setupRealtime();
  }

  ngOnDestroy() {
    this._wsSubscription?.unsubscribe();
  }

  async loadOnlineUsers() {
    try {
      const users = await this._friendship.getOnlineUsers();
      // Filter out self
      const myId = this._passport.data()?.id;
      this.onlineUsers.set(users.filter((u) => u.id !== myId));
      this._cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load online users', e);
    }
  }

  setupRealtime() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
      if (msg.type === 'agent_online' || msg.type === 'agent_offline') {
        this.loadOnlineUsers();
      }
    });
  }
}

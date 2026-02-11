import {
  Component,
  inject,
  Signal,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { FriendshipService } from '../_services/friendship-service';
import { WebsocketService } from '../_services/websocket-service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, CommonModule, RouterModule, MatButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private _router = inject(Router);
  private _passport = inject(PassportService);
  private _friendship = inject(FriendshipService);
  private _wsService = inject(WebsocketService);
  private _cdr = inject(ChangeDetectorRef);

  display_name: Signal<string | undefined>;
  onlineUsers = signal<any[]>([]);
  pendingRequestsCount = signal(0);

  private _wsSubscription?: Subscription;

  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name);
    if (!this._passport.data()) this._router.navigate(['/login']);
  }

  ngOnInit() {
    this.loadData();
    this.setupRealtime();
  }

  ngOnDestroy() {
    this._wsSubscription?.unsubscribe();
  }

  async loadData() {
    try {
      const [online, pending] = await Promise.all([
        this._friendship.getOnlineUsers(),
        this._friendship.getPendingRequests(),
      ]);

      // Filter out self
      const myId = this._passport.data()?.id;
      this.onlineUsers.set(online.filter((u) => u.id !== myId));
      this.pendingRequestsCount.set(pending.length);
      this._cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load home data', e);
    }
  }

  setupRealtime() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
      const networkTypes = ['agent_online', 'agent_offline', 'friend_request', 'friend_accepted'];
      if (networkTypes.includes(msg.type)) {
        this.loadData();
      }
    });
  }

  private _http = inject(HttpClient);
  MakeError(code: number) {
    const url = environment.baseUrl + '/api/util/make_error/' + code;
    this._http.get(url).subscribe({
      error: (e) => console.log(e),
    });
  }
}

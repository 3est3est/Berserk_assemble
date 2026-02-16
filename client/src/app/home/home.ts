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
import { MissionService } from '../_services/mission-service';
import { NotificationService } from '../_services/notification-service';
import { Mission } from '../_models/mission';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private _router = inject(Router);
  private _passport = inject(PassportService);
  private _friendship = inject(FriendshipService);
  private _wsService = inject(WebsocketService);
  private _missionService = inject(MissionService);
  private _notificationService = inject(NotificationService);
  private _cdr = inject(ChangeDetectorRef);

  display_name: Signal<string | undefined>;
  onlineUsers = signal<any[]>([]);
  liveMissions = signal<Mission[]>([]);
  latestNotifications = computed(() => this._notificationService.notifications().slice(0, 5));
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
      const [online, pending, missions] = await Promise.all([
        this._friendship.getOnlineUsers(),
        this._friendship.getPendingRequests(),
        this._missionService.getByFilter({ status: 'Open' }),
        this._notificationService.getNotifications(),
      ]);

      // Filter out self
      const myId = this._passport.data()?.id;
      this.onlineUsers.set(online.filter((u: any) => u.id !== myId));
      this.pendingRequestsCount.set(pending.length);
      this.liveMissions.set(missions.slice(0, 4)); // Show top 4 active vibes
      this._cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load home data', e);
    }
  }

  setupRealtime() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
      const liveTypes = [
        'agent_online',
        'agent_offline',
        'friend_request',
        'friend_accepted',
        'mission_created',
        'mission_updated',
        'mission_deleted',
        'crew_joined',
        'crew_left',
      ];
      if (liveTypes.includes(msg.type)) {
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

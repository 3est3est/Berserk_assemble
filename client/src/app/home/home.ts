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
import { FriendshipService } from '../_services/friendship-service';
import { WebsocketService } from '../_services/websocket-service';
import { MissionService } from '../_services/mission-service';
import { NotificationService } from '../_services/notification-service';
import { Mission } from '../_models/mission';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../_helpers/scroll-reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollRevealDirective],
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

  private _wsSubscription?: Subscription;
  private _lastLoad = 0;

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
      const [online, missions] = await Promise.all([
        this._friendship.getOnlineUsers(),
        this._missionService.getByFilter({ status: 'Open' }),
        this._notificationService.getNotifications(),
      ]);

      const myId = this._passport.data()?.id;
      this.onlineUsers.set(online.filter((u: any) => u.id !== myId));
      this.liveMissions.set(missions.slice(0, 6));
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
        'mission_created',
        'mission_updated',
        'mission_deleted',
        'crew_joined',
        'crew_left',
      ];
      if (liveTypes.includes(msg.type)) {
        const now = Date.now();
        if (now - this._lastLoad > 2000) {
          this._lastLoad = now;
          this.loadData();
        }
      }
    });
  }

  /** Map category string → badge CSS class */
  getCategoryClass(category: string): string {
    const map: Record<string, string> = {
      'Gaming & E-Sports': 'badge-gaming',
      'Sports & Active': 'badge-sports',
      'Social & Chill': 'badge-social',
      'Travel & Trip': 'badge-travel',
      Entertainment: 'badge-ent',
      'Lifestyle & Hobby': 'badge-life',
    };
    return map[category] ?? 'badge-other';
  }
}

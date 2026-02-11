import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MissionService } from '../_services/mission-service';
import { CrewService } from '../_services/crew-service';
import { FriendshipService } from '../_services/friendship-service';
import { Mission } from '../_models/mission';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../_services/websocket-service';
import { RouterModule, Router } from '@angular/router';

interface MissionStats {
  open: number;
  inProgress: number;
  completed: number;
  failed: number;
  total: number;
  successRate: number;
  avgCrewSize: number;
  totalExp: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private _missionService = inject(MissionService);
  private _crewService = inject(CrewService);
  private _friendshipService = inject(FriendshipService);
  private _cdr = inject(ChangeDetectorRef);
  private _wsService = inject(WebsocketService);
  private _router = inject(Router);

  private _wsSubscription?: Subscription;

  stats: MissionStats = {
    open: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    total: 0,
    successRate: 0,
    avgCrewSize: 0,
    totalExp: 0,
  };

  recentMissions: Mission[] = [];
  onlineUsers: any[] = [];
  pendingRequests = signal<any[]>([]);
  isLoading = true;

  ngOnInit() {
    this.loadStats();
    this.loadOnlineUsers();
    this.loadPendingRequests();
    this.setupRealtimeUpdates();
  }

  async loadPendingRequests() {
    try {
      const reqs = await this._friendshipService.getPendingRequests();
      this.pendingRequests.set(reqs);
    } catch (e) {
      console.error('Failed to load pending requests', e);
    }
  }

  async onAccept(id: number) {
    try {
      await this._friendshipService.acceptRequest(id);
      this.loadPendingRequests();
      this.loadOnlineUsers();
    } catch (e) {
      console.error('Failed to accept request', e);
    }
  }

  async onReject(id: number) {
    try {
      await this._friendshipService.rejectRequest(id);
      this.loadPendingRequests();
    } catch (e) {
      console.error('Failed to reject request', e);
    }
  }

  async loadOnlineUsers() {
    try {
      this.onlineUsers = await this._friendshipService.getOnlineUsers();
      this._cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load online users', e);
    }
  }

  viewProfile(id: number) {
    this._router.navigate(['/profile', id]);
  }

  ngOnDestroy(): void {
    this._wsSubscription?.unsubscribe();
  }

  private setupRealtimeUpdates() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
      const missionTypes = [
        'new_crew_joined',
        'crew_left',
        'mission_started',
        'mission_completed',
        'mission_failed',
        'mission_deleted',
        'kicked_from_mission',
      ];

      const networkTypes = ['agent_online', 'agent_offline', 'friend_request', 'friend_accepted'];

      if (missionTypes.includes(msg.type)) {
        console.log('[Dashboard] Real-time stats update received, reloading...');
        this.loadStats();
      }

      if (networkTypes.includes(msg.type)) {
        console.log('[Dashboard] Network update received, refreshing online list...');
        this.loadOnlineUsers();
      }
    });
  }

  async loadStats() {
    this.isLoading = true;

    try {
      // 1. Get missions I own (Chief)
      const myMissions = await this._missionService.getMyMissions();
      // 2. Get missions I joined (Crew)
      const joinedMissions = await this._crewService.getMyJoinedMissions();

      // 3. Combine unique missions
      const allMissions = [...myMissions, ...joinedMissions];
      const uniqueMissions = Array.from(
        new Map(allMissions.map((item) => [item.id, item])).values(),
      );

      // 4. Calculate stats
      this.calculateStats(uniqueMissions);

      // 5. Get recent missions (last 5)
      this.recentMissions = [...uniqueMissions]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

      this._cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateStats(missions: Mission[]) {
    let completedCount = 0;
    let failedCount = 0;
    let totalCrewCount = 0;

    this.stats = {
      open: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      total: missions.length,
      successRate: 0,
      avgCrewSize: 0,
      totalExp: 0,
    };

    missions.forEach((m) => {
      const status = m.status.toLowerCase();
      totalCrewCount += m.crew_count;

      switch (status) {
        case 'open':
          this.stats.open++;
          break;
        case 'inprogress':
        case 'in-progress':
          this.stats.inProgress++;
          break;
        case 'completed':
          this.stats.completed++;
          completedCount++;
          // Simple XP calculation: 100 per completed mission
          this.stats.totalExp += 100;
          break;
        case 'failed':
          this.stats.failed++;
          failedCount++;
          break;
      }
    });

    this.stats.completed = completedCount;
    this.stats.failed = failedCount;

    // Calculate success rate
    const finishedCount = completedCount + failedCount;
    this.stats.successRate =
      finishedCount > 0 ? Math.round((completedCount / finishedCount) * 100) : 0;

    // Calculate avg crew size
    this.stats.avgCrewSize =
      missions.length > 0 ? parseFloat((totalCrewCount / missions.length).toFixed(1)) : 0;
  }

  getProgressBarColor(successRate: number): string {
    if (successRate >= 80) return 'var(--ctp-green)';
    if (successRate >= 50) return 'var(--ctp-yellow)';
    return 'var(--ctp-red)';
  }
}

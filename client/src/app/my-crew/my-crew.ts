import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Mission } from '../_models/mission';
import { CrewService } from '../_services/crew-service';
import { MissionService } from '../_services/mission-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ToastService } from '../_services/toast-service';
import { WebsocketService } from '../_services/websocket-service';

@Component({
  selector: 'app-my-crew',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './my-crew.html',
  styleUrl: './my-crew.scss',
})
export class MyCrew implements OnDestroy {
  private _crewService = inject(CrewService);
  private _missionService = inject(MissionService);
  private _router = inject(Router);
  private _toast = inject(ToastService);
  private _wsService = inject(WebsocketService);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly myJoinedMissions$ = this._missionsSubject.asObservable();

  private _wsSubscription?: Subscription;

  constructor() {
    this.loadMyJoinedMissions();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this._wsSubscription?.unsubscribe();
  }

  private setupRealtimeUpdates() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
      if (!msg) return;
      const reloadTypes = [
        'new_crew_joined',
        'crew_left',
        'mission_started',
        'mission_completed',
        'mission_failed',
        'mission_deleted',
        'kicked_from_mission',
      ];
      if (reloadTypes.includes(msg.type)) {
        console.log('[MyCrew] Real-time mission update received, reloading...');
        this.loadMyJoinedMissions();
      }
    });
  }

  private async loadMyJoinedMissions() {
    try {
      const missions = await this._crewService.getMyJoinedMissions();
      this._missionsSubject.next(missions);
    } catch (e) {
      console.error('Failed to load joined missions', e);
    }
  }

  onManage(mission: Mission) {
    this._router.navigate(['/missions', mission.id]);
  }

  async onLeave(mission: Mission, event: MouseEvent) {
    if (event) event.stopPropagation();
    if (!confirm(`Do you want to leave mission "${mission.name}"?`)) return;

    try {
      await this._crewService.leave(mission.id);
      this._toast.success(`You have left the mission "${mission.name}".`);
      // Reload after leaving
      this.loadMyJoinedMissions();
    } catch (e: any) {
      console.error('Failed to leave mission', e);
      this._toast.error('Failed to leave mission: ' + (e.error || e.message));
    }
  }

  getCategoryClass(category?: string): string {
    const map: Record<string, string> = {
      'Gaming & E-Sports': 'badge-gaming',
      'Sports & Active': 'badge-sports',
      'Social & Chill': 'badge-social',
      'Travel & Trip': 'badge-travel',
      Entertainment: 'badge-ent',
      'Lifestyle & Hobby': 'badge-life',
    };
    return map[category || ''] ?? 'badge-other';
  }

  /** Get psychedelic image for category from local assets */
  getVibeImage(category?: string): string {
    const catFilename = (category || 'Other').replace(/ /g, '_');
    return `assets/missionCard_wallpaper/${catFilename}.jpg`;
  }
}

import { Component, computed, inject, Signal, OnDestroy } from '@angular/core';
import { MissionService } from '../_services/mission-service';
import { MissionFilter } from '../_models/mission-filter';
import { FormsModule } from '@angular/forms';
import { Mission } from '../_models/mission';
import { PassportService } from '../_services/passport-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CrewService } from '../_services/crew-service';
import { getUserIdFromToken } from '../_helpers/util';
import { ToastService } from '../_services/toast-service';
import { MatIconModule } from '@angular/material/icon';
import { WebsocketService } from '../_services/websocket-service';

@Component({
  selector: 'app-missions',
  imports: [FormsModule, CommonModule, MatIconModule],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions implements OnDestroy {
  private _mission = inject(MissionService);
  private _crewService = inject(CrewService);
  private _passportService = inject(PassportService);
  private _toast = inject(ToastService);
  private _wsService = inject(WebsocketService);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly missions$ = this._missionsSubject.asObservable();
  private _wsSubscription?: Subscription;

  filter: MissionFilter = { status: '' };
  isSignin: Signal<boolean>;

  constructor() {
    this.isSignin = computed(() => this._passportService.isSignin());
    this.filter = this._mission.filter;
    // Initial data load
    this.onSubmit();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this._wsSubscription?.unsubscribe();
  }

  private setupRealtimeUpdates() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
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
        console.log('[Missions] Global mission update received, reloading...');
        this.onSubmit(); // Reload list to update counts and availability
      }
    });
  }

  async onSubmit() {
    // If logged in, filter out own missions and joined missions
    const passport = this._passportService.data();
    if (passport) {
      const userId = getUserIdFromToken(passport.token);
      if (userId) {
        this.filter.exclude_user_id = userId;
      }
    } else {
      // If not logged in, remove the exclude filter
      delete this.filter.exclude_user_id;
    }

    const missions = await this._mission.getByFilter(this.filter);
    this._missionsSubject.next(missions);
  }

  async onJoin(mission: Mission) {
    if (!confirm(`Do you want to join mission "${mission.name}"?`)) return;

    try {
      await this._crewService.join(mission.id);
      this._toast.success(`Joined mission "${mission.name}"! Welcome to the crew.`);
      // Reload missions to update the list (the joined mission should disappear)
      this.onSubmit();
    } catch (e: any) {
      console.error('Join failed', e);
      this._toast.error('Failed to join mission: ' + (e.error || e.message));
    }
  }
}

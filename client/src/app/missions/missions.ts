import { Component, computed, inject, Signal } from '@angular/core';
import { MissionService } from '../_services/mission-service';
import { MissionFilter } from '../_models/mission-filter';
import { FormsModule } from '@angular/forms';
import { Mission } from '../_models/mission';
import { PassportService } from '../_services/passport-service';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CrewService } from '../_services/crew-service';
import { getUserIdFromToken } from '../_helpers/util';
import { ToastService } from '../_services/toast-service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-missions',
  imports: [FormsModule, CommonModule, MatIconModule],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService);
  private _crewService = inject(CrewService);
  private _passportService = inject(PassportService);
  private _toast = inject(ToastService);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly missions$ = this._missionsSubject.asObservable();

  filter: MissionFilter = { status: '' };
  isSignin: Signal<boolean>;

  constructor() {
    this.isSignin = computed(() => this._passportService.isSignin());
    this.filter = this._mission.filter;
    // Initial data load
    this.onSubmit();
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

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

@Component({
  selector: 'app-missions',
  imports: [FormsModule, CommonModule],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService);
  private _crewService = inject(CrewService);
  private _passportService = inject(PassportService);

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
        this.filter.exclude_brawler_id = userId;
      }
    } else {
      // If not logged in, remove the exclude filter
      delete this.filter.exclude_brawler_id;
    }

    const missions = await this._mission.getByFilter(this.filter);
    this._missionsSubject.next(missions);
  }

  async onJoin(mission: Mission) {
    if (!confirm(`Do you want to join mission "${mission.name}"?`)) return;

    try {
      await this._crewService.join(mission.id);
      alert('Joined mission successfully!');
      // Reload missions to update the list (the joined mission should disappear)
      this.onSubmit();
    } catch (e: any) {
      console.error('Join failed', e);
      alert('Failed to join mission: ' + (e.error || e.message));
    }
  }
}

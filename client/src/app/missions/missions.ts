import { Component, computed, inject, Signal } from '@angular/core';
import { MissionService } from '../_services/mission-service';
import { MissionFilter } from '../_models/mission-filter';
import { FormsModule } from '@angular/forms';
import { Mission } from '../_models/mission';
import { PassportService } from '../_services/passport-service';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-missions',
  imports: [FormsModule, CommonModule],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService);
  private _passportService = inject(PassportService);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly missions$ = this._missionsSubject.asObservable();

  filter: MissionFilter = {};
  isSignin: Signal<boolean>;

  constructor() {
    this.isSignin = computed(() => this._passportService.isSignin());
    this.filter = this._mission.filter;
    this.onSubmit();
  }

  async onSubmit() {
    const missions = await this._mission.getByFilter(this.filter);
    this._missionsSubject.next(missions);
  }
}

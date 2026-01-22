import { Component, inject } from '@angular/core';
import { MissionService } from '../_services/mission-service';
import { MissionFilter } from '../_models/mission-filter';
import { FormsModule } from '@angular/forms';
import { Mission } from '../_models/mission';

@Component({
  selector: 'app-missions',
  imports: [FormsModule],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions {
  private _mission = inject(MissionService);
  filter: MissionFilter = {};
  missions: Mission[] = [];

  constructor() {
    this.filter = this._mission.filter;
  }

  async onSubmit() {
    this.missions = await this._mission.getByFilter(this.filter);
  }
}

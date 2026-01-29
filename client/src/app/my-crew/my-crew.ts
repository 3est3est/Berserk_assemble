import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrewService } from '../_services/crew-service';
import { Mission } from '../_models/mission';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-my-crew',
  imports: [CommonModule],
  templateUrl: './my-crew.html',
  styleUrl: './my-crew.scss',
})
export class MyCrew {
  private _crewService = inject(CrewService);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly myJoinedMissions$ = this._missionsSubject.asObservable();

  constructor() {
    this.loadMyJoinedMissions();
  }

  private async loadMyJoinedMissions() {
    try {
      const missions = await this._crewService.getMyJoinedMissions();
      this._missionsSubject.next(missions);
    } catch (e) {
      console.error('Failed to load joined missions', e);
    }
  }

  async onLeave(mission: Mission) {
    try {
      await this._crewService.leave(mission.id);
      // Reload after leaving
      this.loadMyJoinedMissions();
    } catch (e) {
      console.error('Failed to leave mission', e);
    }
  }
}

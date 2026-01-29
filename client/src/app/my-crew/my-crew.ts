import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrewService } from '../_services/crew-service';
import { Mission } from '../_models/mission';
import { BehaviorSubject } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { ToastService } from '../_services/toast-service';

@Component({
  selector: 'app-my-crew',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-crew.html',
  styleUrl: './my-crew.scss',
})
export class MyCrew {
  private _crewService = inject(CrewService);
  private _router = inject(Router);
  private _toast = inject(ToastService);

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

  onManage(mission: Mission) {
    this._router.navigate(['/missions', mission.id]);
  }

  async onLeave(mission: Mission, event: MouseEvent) {
    event.stopPropagation();
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
}

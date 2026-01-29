import { Component, inject } from '@angular/core';
import { Mission } from '../../_models/mission';
import { MissionService } from '../../_services/mission-service';
import { MatDialog } from '@angular/material/dialog';
import { NewMission } from '../../_dialogs/new-mission/new-mission';
import { AddMission } from '../../_models/add-mission';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-mission-manager',
  imports: [MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.scss',
})
export class MissionManager {
  private _missionService = inject(MissionService);
  private _dialog = inject(MatDialog);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly myMissions$ = this._missionsSubject.asObservable();

  constructor() {
    this.loadMyMission();
  }

  private async loadMyMission() {
    const missions = await this._missionService.getMyMissions();
    this._missionsSubject.next(missions);
  }

  openDialog() {
    const ref = this._dialog.open(NewMission);
    ref.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._missionService.add(result);
          this.loadMyMission();
        } catch (e) {
          console.error('Failed to add mission', e);
        }
      }
    });
  }

  onEdit(mission: Mission) {
    const ref = this._dialog.open(NewMission, {
      data: { name: mission.name, description: mission.description },
    });

    ref.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._missionService.update(mission.id, result);
          this.loadMyMission();
        } catch (e) {
          console.error('Failed to update mission', e);
        }
      }
    });
  }

  async onDelete(mission: Mission) {
    if (!confirm(`Do you want to delete mission "${mission.name}"?`)) return;

    try {
      await this._missionService.delete(mission.id);
      this.loadMyMission();
    } catch (e) {
      console.error('Failed to delete mission', e);
    }
  }
}

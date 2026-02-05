import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Mission } from '../../_models/mission';
import { MissionService } from '../../_services/mission-service';
import { MatDialog } from '@angular/material/dialog';
import { NewMission } from '../../_dialogs/new-mission/new-mission';
import { AddMission } from '../../_models/add-mission';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../_services/toast-service';

@Component({
  selector: 'app-mission-manager',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CommonModule, RouterModule],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.scss',
})
export class MissionManager {
  private _missionService = inject(MissionService);
  private _dialog = inject(MatDialog);
  private _router = inject(Router);
  private _toast = inject(ToastService);

  private _missionsSubject = new BehaviorSubject<Mission[]>([]);
  readonly myMissions$ = this._missionsSubject.asObservable();

  constructor() {
    this.loadMyMission();
  }

  private async loadMyMission() {
    const missions = await this._missionService.getMyMissions();
    this._missionsSubject.next(missions);
  }

  onManage(mission: Mission) {
    this._router.navigate(['/missions', mission.id]);
  }

  openDialog() {
    const ref = this._dialog.open(NewMission);
    ref.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._missionService.add(result);
          this._toast.success('Mission created successfully!');
          this.loadMyMission();
        } catch (e: any) {
          console.error('Failed to add mission', e);
          this._toast.error('Failed to create mission: ' + (e.error || e.message));
        }
      }
    });
  }

  onEdit(event: MouseEvent, mission: Mission) {
    event.stopPropagation();
    const ref = this._dialog.open(NewMission, {
      data: {
        name: mission.name,
        description: mission.description,
        max_crew: mission.max_crew,
        scheduled_at: mission.scheduled_at,
        location: mission.location,
      },
    });

    ref.afterClosed().subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._missionService.update(mission.id, result);
          this._toast.success('Mission updated successfully!');
          this.loadMyMission();
        } catch (e: any) {
          console.error('Failed to update mission', e);
          this._toast.error('Failed to update mission: ' + (e.error || e.message));
        }
      }
    });
  }

  async onDelete(event: MouseEvent, mission: Mission) {
    event.stopPropagation();
    if (!confirm(`Do you want to delete mission "${mission.name}"?`)) return;

    try {
      await this._missionService.delete(mission.id);
      this._toast.success('Mission deleted successfully.');
      this.loadMyMission();
    } catch (e: any) {
      console.error('Failed to delete mission', e);
      this._toast.error('Failed to delete mission: ' + (e.error || e.message));
    }
  }

  async onStart(mission: Mission) {
    try {
      await this._missionService.startMission(mission.id);
      this._toast.success('Mission started!');
      this.loadMyMission();
    } catch (e: any) {
      console.error('Failed to start mission', e);
      this._toast.error('Failed to start mission: ' + (e.error || e.message));
    }
  }

  async onComplete(mission: Mission) {
    try {
      await this._missionService.completeMission(mission.id);
      this._toast.success('Mission completed! Great work.');
      this.loadMyMission();
    } catch (e: any) {
      console.error('Failed to complete mission', e);
      this._toast.error('Failed to complete mission: ' + (e.error || e.message));
    }
  }

  async onFail(mission: Mission) {
    try {
      await this._missionService.failMission(mission.id);
      this._toast.warning('Mission marked as failed.');
      this.loadMyMission();
    } catch (e: any) {
      console.error('Failed to fail mission', e);
      this._toast.error('Failed to fail mission: ' + (e.error || e.message));
    }
  }

  crewMap: { [key: number]: any[] } = {};
  showCrewMap: { [key: number]: boolean } = {};

  async toggleCrew(mission: Mission) {
    if (this.showCrewMap[mission.id]) {
      this.showCrewMap[mission.id] = false;
      return;
    }

    try {
      const crew = await this._missionService.getCrew(mission.id);
      this.crewMap[mission.id] = crew;
      this.showCrewMap[mission.id] = true;
    } catch (e) {
      console.error('Failed to load crew', e);
    }
  }

  async onKick(mission: Mission, member: any) {
    if (!confirm(`Do you want to kick "${member.display_name}" from the mission?`)) return;

    try {
      await this._missionService.kickMember(mission.id, member.id);
      this._toast.success(`Kicked "${member.display_name}" from the mission.`);
      // Reload crew
      const crew = await this._missionService.getCrew(mission.id);
      this.crewMap[mission.id] = crew;
      // Reload missions to update count
      this.loadMyMission();
    } catch (e: any) {
      console.error('Failed to kick member', e);
      this._toast.error('Failed to kick: ' + (e.error || e.message));
    }
  }
}

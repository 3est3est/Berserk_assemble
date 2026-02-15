import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Mission } from '../../_models/mission';
import { MissionService } from '../../_services/mission-service';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { NewMission } from '../../_dialogs/new-mission/new-mission';
import { AddMission } from '../../_models/add-mission';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService } from '../../_services/toast-service';
import { WebsocketService } from '../../_services/websocket-service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-mission-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    DynamicDialogModule,
  ],
  templateUrl: './mission-manager.html',
  styleUrl: './mission-manager.scss',
})
export class MissionManager implements OnDestroy {
  private _missionService = inject(MissionService);
  private _dialog = inject(DialogService);
  private _router = inject(Router);
  private _toast = inject(ToastService);
  private _wsService = inject(WebsocketService);

  myMissions = signal<Mission[]>([]);
  private _wsSubscription?: Subscription;

  constructor() {
    this.loadMyMission();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy() {
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
      ];
      if (reloadTypes.includes(msg.type)) {
        this.loadMyMission();
      }
    });
  }

  async loadMyMission() {
    try {
      const missions = await this._missionService.getMyMissions();
      this.myMissions.set(missions);
    } catch (e) {
      console.error('Failed to load missions', e);
    }
  }

  onCreate() {
    const ref = (this._dialog as any).open(NewMission, {
      header: 'Initialize Mission',
      width: '500px',
      modal: true,
      showHeader: false,
      styleClass: 'void-dialog',
    });
    ref.onClose.subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._missionService.add(result);
          this._toast.success('Mission created successfully!');
          this.loadMyMission();
        } catch (e: any) {
          this._toast.error('Failed to create mission: ' + (e.error || e.message));
        }
      }
    });
  }

  onEdit(mission: Mission) {
    const ref = (this._dialog as any).open(NewMission, {
      data: { ...mission },
      header: 'Modify Mission',
      width: '500px',
      modal: true,
      showHeader: false,
      styleClass: 'void-dialog',
    });
    ref.onClose.subscribe(async (result: AddMission) => {
      if (result) {
        try {
          await this._missionService.update(mission.id, result);
          this._toast.success('Mission updated successfully!');
          this.loadMyMission();
        } catch (e: any) {
          this._toast.error('Failed to update mission: ' + (e.error || e.message));
        }
      }
    });
  }

  async onDelete(mission: Mission) {
    if (!confirm(`Do you want to delete mission "${mission.name}"?`)) return;
    try {
      await this._missionService.delete(mission.id);
      this._toast.success('Mission deleted.');
      this.loadMyMission();
    } catch (e: any) {
      this._toast.error('Deletion failed: ' + (e.error || e.message));
    }
  }

  onManage(mission: Mission) {
    this._router.navigate(['/missions', mission.id]);
  }
}

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
          // 1. สั่งบันทึกผ่าน API และรับ ID กลับมา
          const id = await this._missionService.add(result);

          // 2. สร้างก้อนข้อมูลใหม่เพื่อ Update เข้าไปใน BehaviorSubject ทันที
          // เพื่อความแม่นยำเราสามารถ load ใหม่ทั้งหมด หรือสร้าง object จำลองมาแปะก็ได้
          // ในสไลด์แนะนำให้แปะเพิ่มเข้าไปใน list เดิม (Optimistic Update)
          this.loadMyMission(); // วิธีนี้ชัวร์ที่สุดว่าข้อมูลจาก DB ครบถ้วน
        } catch (e) {
          console.error('Failed to add mission', e);
        }
      }
    });
  }
}

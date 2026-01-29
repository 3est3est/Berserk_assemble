import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MissionService } from '../../_services/mission-service';
import { Mission } from '../../_models/mission';
import { PassportService } from '../../_services/passport-service';
import { ToastService } from '../../_services/toast-service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MissionComment } from '../../_models/mission-comment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.scss',
})
export class MissionDetail implements OnInit {
  private _route = inject(ActivatedRoute);
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _toast = inject(ToastService);
  private _cdr = inject(ChangeDetectorRef);

  mission?: Mission;
  crew: any[] = [];
  comments: MissionComment[] = [];
  newCommentContent = '';
  loading = true;
  sendingComment = false;
  countdownValue = 0;
  isCountdownActive = false;

  get isChief(): boolean {
    return this.mission?.chief_display_name === this._passportService.data()?.display_name;
  }

  get currentUserId(): number | undefined {
    return this._passportService.data()?.id;
  }

  ngOnInit() {
    this._route.params.subscribe((params) => {
      const id = +params['id'];
      if (id) {
        this.loadMission(id);
      }
    });
  }

  async loadMission(id: number) {
    this.loading = true;
    console.log('Loading mission:', id);
    try {
      this.mission = await this._missionService.getById(id);
      console.log('Mission loaded:', this.mission);
      this.crew = await this._missionService.getCrew(id);
      console.log('Crew loaded:', this.crew);
      this.comments = await this._missionService.getComments(id);
      console.log('Comments loaded:', this.comments);
    } catch (e) {
      console.error('Failed to load mission detail', e);
    } finally {
      this.loading = false;
    }
  }

  async sendComment() {
    if (!this.newCommentContent.trim() || !this.mission || this.sendingComment) return;

    this.sendingComment = true;
    try {
      await this._missionService.addComment(this.mission.id, this.newCommentContent.trim());
      this.newCommentContent = '';
      this.comments = await this._missionService.getComments(this.mission.id);
    } catch (e) {
      console.error('Failed to send comment', e);
    } finally {
      this.sendingComment = false;
    }
  }

  async onStart() {
    if (!this.mission || this.isCountdownActive) return;

    this.isCountdownActive = true;
    this.countdownValue = 5; // 5 seconds countdown
    this._toast.info(`Preparing for departure... Starting in ${this.countdownValue}`);

    const timer = setInterval(async () => {
      this.countdownValue--;

      if (this.countdownValue <= 0) {
        clearInterval(timer);

        // Use setTimeout to defer state change to next tick (fixes NG0100)
        setTimeout(async () => {
          this.isCountdownActive = false;
          try {
            await this._missionService.startMission(this.mission!.id);
            this._toast.success('MISSION STARTED! GO BERSERK!');
            await this.loadMission(this.mission!.id);
          } catch (e: any) {
            this._toast.error('Failed to start: ' + (e.error || e.message));
          }
        }, 0);
      }
    }, 1000);
  }

  async onComplete() {
    if (!this.mission) return;
    try {
      await this._missionService.completeMission(this.mission.id);
      this._toast.success('MISSION COMPLETED! Well done, Crew!');
      await this.loadMission(this.mission.id);
    } catch (e: any) {
      this._toast.error('Failed to complete: ' + (e.error || e.message));
    }
  }

  async onFail() {
    if (!this.mission) return;
    try {
      await this._missionService.failMission(this.mission.id);
      this._toast.warning('MISSION FAILED. Regroup and try again.');
      await this.loadMission(this.mission.id);
    } catch (e: any) {
      this._toast.error('Failed to fail: ' + (e.error || e.message));
    }
  }

  async onKick(member: any) {
    if (!this.mission) return;
    if (!confirm(`Do you want to kick "${member.display_name}"?`)) return;

    try {
      await this._missionService.kickMember(this.mission.id, member.id);
      this._toast.success(`Kicked "${member.display_name}" from the mission.`);
      this.crew = await this._missionService.getCrew(this.mission.id);
      this.mission.crew_count--;
    } catch (e: any) {
      this._toast.error('Failed to kick: ' + (e.error || e.message));
    }
  }

  async clearChat() {
    if (!this.mission || !confirm('Are you sure you want to clear all messages?')) return;
    try {
      await this._missionService.clearComments(this.mission.id);
      this._toast.success('Chat history cleared.');
      this.comments = [];
    } catch (e: any) {
      this._toast.error('Failed to clear chat: ' + (e.error || e.message));
    }
  }
}

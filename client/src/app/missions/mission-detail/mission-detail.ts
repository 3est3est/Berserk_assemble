import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MissionService } from '../../_services/mission-service';
import { Mission } from '../../_models/mission';
import { PassportService } from '../../_services/passport-service';
import { ToastService } from '../../_services/toast-service';
import { WebsocketService } from '../../_services/websocket-service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MissionComment } from '../../_models/mission-comment';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.scss',
})
export class MissionDetail implements OnInit, OnDestroy {
  private _route = inject(ActivatedRoute);
  private _missionService = inject(MissionService);
  private _passportService = inject(PassportService);
  private _toast = inject(ToastService);
  private _wsService = inject(WebsocketService);
  private _cdr = inject(ChangeDetectorRef);

  mission?: Mission;
  crew: any[] = [];
  comments: MissionComment[] = [];
  newCommentContent = '';
  loading = true;
  sendingComment = false;
  countdownValue = 0;
  isCountdownActive = false;

  private _wsSubscription?: Subscription;
  private _routeSubscription?: Subscription;

  get isChief(): boolean {
    return this.mission?.chief_display_name === this._passportService.data()?.display_name;
  }

  get currentUserId(): number | undefined {
    return this._passportService.data()?.id;
  }

  ngOnInit() {
    this._routeSubscription = this._route.params
      .pipe(
        map((params) => +params['id']),
        distinctUntilChanged(),
      )
      .subscribe((id) => {
        if (id) {
          this.loadMission(id);

          // Setup WebSocket
          this._wsService.disconnect();
          this._wsService.connect(id);

          this._wsSubscription?.unsubscribe();
          this._wsSubscription = this._wsService.messages$.subscribe((msg) => {
            this.handleWsMessage(msg);
          });
        }
      });
  }

  ngOnDestroy() {
    this._routeSubscription?.unsubscribe();
    this._wsSubscription?.unsubscribe();
    this._wsService.disconnect();
  }

  private handleWsMessage(msg: any) {
    if (msg.type === 'new_comment') {
      const newComment: MissionComment = msg.data;

      const exists = this.comments.some((c) => c.id === newComment.id);
      if (!exists) {
        this.comments = [...this.comments, newComment];
        this._cdr.markForCheck(); // BIND TO VIEW IMMEDIATELY
      }
    } else if (msg.type === 'clear_chat') {
      this.comments = [];
      this._cdr.markForCheck();
    }
  }

  async loadMission(id: number) {
    this.loading = true;
    try {
      this.mission = await this._missionService.getById(id);

      const [crew, comments] = await Promise.all([
        this._missionService.getCrew(id),
        this._missionService.getComments(id),
      ]);

      this.crew = crew;
      this.comments = comments;
    } catch (e) {
      console.error('Failed to load mission detail', e);
      this._toast.error('Error loading mission details');
    } finally {
      // Use setTimeout to skip a tick and avoid ExpressionChanged error
      setTimeout(() => {
        this.loading = false;
        this._cdr.detectChanges();
      }, 0);
    }
  }

  async sendComment() {
    if (!this.newCommentContent.trim() || !this.mission || this.sendingComment) return;

    this.sendingComment = true;
    const content = this.newCommentContent.trim();
    this.newCommentContent = '';

    try {
      await this._missionService.addComment(this.mission.id, content);
      // The message will arrive via WebSocket and trigger handleWsMessage
    } catch (e) {
      console.error('Failed to send comment', e);
      this._toast.error('Failed to send message');
      this.newCommentContent = content; // Restore content if failed
    } finally {
      setTimeout(() => {
        this.sendingComment = false;
        this._cdr.detectChanges();
      }, 0);
    }
  }

  async onStart() {
    if (!this.mission || this.isCountdownActive) return;

    this.isCountdownActive = true;
    this.countdownValue = 5;
    this._toast.info(`Preparing for departure... Starting in ${this.countdownValue}`);

    const timer = setInterval(async () => {
      this.countdownValue--;

      if (this.countdownValue <= 0) {
        clearInterval(timer);

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

  getRemainingTime(scheduledAt: Date | string): string {
    const target = new Date(scheduledAt).getTime();
    const now = new Date().getTime();
    const diff = target - now;

    if (diff <= 0) return 'Gathering now...';

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d ${hours % 24}h`;
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    return `in ${minutes}m`;
  }
}

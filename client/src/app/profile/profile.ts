import { Component, Signal, computed, inject, signal, OnInit } from '@angular/core';
import { getAvatarUrl } from '../_helpers/util';
import { PassportService } from '../_services/passport-service';
import { MatDialog } from '@angular/material/dialog';
import { UploadImg } from '../_dialogs/upload-img/upload-img';
import { EditProfileDialog } from './edit-profile-dialog';
import { UserService } from '../_services/user-service';
import { MissionService } from '../_services/mission-service';
import { Mission } from '../_models/mission';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  avatar_url: Signal<string>;
  display_name: Signal<string | undefined>;
  bio: Signal<string | undefined>;
  discord_id: Signal<string | undefined>;
  instagram: Signal<string | undefined>;
  facebook: Signal<string | undefined>;
  contact_email: Signal<string | undefined>;

  missions = signal<Mission[]>([]);
  stats = computed(() => {
    const all = this.missions();
    const userId = this._passport.data()?.id;

    // Social App Stats
    const hosted = all.filter((m) => m.chief_id === userId).length;
    const joined = all.filter((m) => m.chief_id !== userId).length;
    const active = all.filter((m) => ['Open', 'In Progress'].includes(m.status)).length;

    return {
      hosted: hosted,
      joined: joined,
      active: active,
    };
  });

  rank = computed(() => {
    const totalActivities = this.missions().length;
    if (totalActivities > 20) return 'Organizer';
    if (totalActivities > 5) return 'Member';
    return 'Newcomer';
  });

  private _passport = inject(PassportService);
  private _dialog = inject(MatDialog);
  private _user = inject(UserService);
  private _missionService = inject(MissionService);

  constructor() {
    this.avatar_url = computed(() => this._passport.avatar());
    this.display_name = computed(() => this._passport.data()?.display_name);
    this.bio = computed(() => this._passport.data()?.bio);
    this.discord_id = computed(() => this._passport.data()?.discord_id);
    this.instagram = computed(() => this._passport.data()?.instagram);
    this.facebook = computed(() => this._passport.data()?.facebook);
    this.contact_email = computed(() => this._passport.data()?.contact_email);
  }

  async ngOnInit() {
    try {
      const missions = await this._missionService.getMyMissions();
      this.missions.set(missions);
    } catch (e) {
      console.error('Failed to load missions for profile stats', e);
    }
  }

  openAvatarDialog() {
    const ref = this._dialog.open(UploadImg);
    ref.afterClosed().subscribe(async (file) => {
      if (file) {
        const error = await this._user.uploadAvatarImg(file);
        if (error) {
          console.error(error);
        }
      }
    });
  }

  openEditProfileDialog() {
    const dialogRef = this._dialog.open(EditProfileDialog, {
      width: '460px',
      data: {
        displayName: this.display_name() || '',
        bio: this.bio(),
        discordId: this.discord_id(),
        instagram: this.instagram(),
        facebook: this.facebook(),
        contactEmail: this.contact_email(),
      },
      panelClass: 'dark-modal-panel',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // UI refreshes via signals
      }
    });
  }
}

import { Component, Signal, computed, inject, signal, OnInit } from '@angular/core';
import { getAvatarUrl } from '../_helpers/util';
import { PassportService } from '../_services/passport-service';
import { MatDialog } from '@angular/material/dialog';
import { UploadImg } from '../_dialogs/upload-img/upload-img';
import { EditProfileDialog } from './edit-profile-dialog';
import { UserService } from '../_services/user-service';
import { MissionService } from '../_services/mission-service';
import { FriendshipService } from '../_services/friendship-service';
import { Mission } from '../_models/mission';
import { ActivatedRoute } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { ChatService } from '../_services/chat-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, MatMenuModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private _chat = inject(ChatService);
  private _passport = inject(PassportService);
  private _dialog = inject(MatDialog);
  private _user = inject(UserService);
  private _missionService = inject(MissionService);
  private _friendshipService = inject(FriendshipService);
  private _route = inject(ActivatedRoute);

  // Target user data
  targetUser = signal<any>(null);
  isOwnProfile = signal(true);
  friendshipStatus = signal<string | null>(null);

  avatar_url = computed(() => {
    if (this.isOwnProfile()) return this._passport.avatar();
    return this.targetUser()?.avatar_url || 'assets/default-avatar.png';
  });

  display_name = computed(() => {
    if (this.isOwnProfile()) return this._passport.data()?.display_name;
    return this.targetUser()?.display_name;
  });

  bio = computed(() => {
    if (this.isOwnProfile()) return this._passport.data()?.bio;
    return this.targetUser()?.bio;
  });

  discord_id = computed(() => {
    if (this.isOwnProfile()) return this._passport.data()?.discord_id;
    return this.targetUser()?.discord_id;
  });

  instagram = computed(() => {
    if (this.isOwnProfile()) return this._passport.data()?.instagram;
    return this.targetUser()?.instagram;
  });

  facebook = computed(() => {
    if (this.isOwnProfile()) return this._passport.data()?.facebook;
    return this.targetUser()?.facebook;
  });

  contact_email = computed(() => {
    if (this.isOwnProfile()) return this._passport.data()?.contact_email;
    return this.targetUser()?.contact_email;
  });

  missions = signal<Mission[]>([]);
  stats = computed(() => {
    const all = this.missions();
    const profileUserId = this.isOwnProfile() ? this._passport.data()?.id : this.targetUser()?.id;

    if (!profileUserId) return { hosted: 0, joined: 0, active: 0 };

    const hosted = all.filter((m) => m.chief_id === profileUserId).length;
    const joined = all.filter((m) => m.chief_id !== profileUserId).length;
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

  async ngOnInit() {
    this._route.params.subscribe(async (params) => {
      const id = params['id'];
      if (id && id != this._passport.data()?.id) {
        this.isOwnProfile.set(false);
        try {
          const user = await this._user.getProfile(Number(id));
          this.targetUser.set(user);
          this.loadFriendshipStatus(Number(id));
          this.missions.set([]);
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      } else {
        this.isOwnProfile.set(true);
        this.targetUser.set(null);
        this.loadMyMissions();
      }
    });
  }

  async loadMyMissions() {
    try {
      const missions = await this._missionService.getMyMissions();
      this.missions.set(missions);
    } catch (e) {
      console.error('Failed to load missions', e);
    }
  }

  async loadFriendshipStatus(otherId: number) {
    try {
      const status = await this._friendshipService.getFriendshipStatus(otherId);
      this.friendshipStatus.set(status);
    } catch (e) {
      console.error('Failed to load friendship status', e);
    }
  }

  async addFriend() {
    const targetId = this.targetUser()?.id;
    if (!targetId) return;
    try {
      await this._friendshipService.sendRequest(targetId);
      this.friendshipStatus.set('pending');
    } catch (e) {
      console.error('Failed to send friend request', e);
    }
  }

  async unfriend() {
    const target = this.targetUser();
    if (!target) return;

    if (confirm(`Remove ${target.display_name} from friends?`)) {
      try {
        await this._friendshipService.removeFriend(target.id);
        this.friendshipStatus.set(null);
      } catch (e) {
        console.error('Failed to unfriend', e);
      }
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

  openChat() {
    const user = this.targetUser();
    if (!user) return;
    this._chat.openChatWithUser({
      id: user.id,
      display_name: user.display_name,
    });
  }
}

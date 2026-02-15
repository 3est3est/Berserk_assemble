import { Component, Signal, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MenuModule } from 'primeng/menu';
import { UploadImg } from '../_dialogs/upload-img/upload-img';
import { EditProfileDialog } from './edit-profile-dialog';
import { UserService } from '../_services/user-service';
import { MissionService } from '../_services/mission-service';
import { FriendshipService } from '../_services/friendship-service';
import { ChatService } from '../_services/chat-service';
import { Mission } from '../_models/mission';

// PrimeNG
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, MenuModule, DynamicDialogModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private _chat = inject(ChatService);
  private _passport = inject(PassportService);
  private _dialog = inject(DialogService);
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
    const user = this.targetUser();
    if (user?.avatar_url) return user.avatar_url;
    if (user?.display_name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=random&size=128`;
    }
    return 'assets/default-avatar.png';
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
    const ref = (this._dialog as any).open(UploadImg, {
      header: 'Upload Avatar',
      width: '400px',
      modal: true,
      showHeader: false,
      styleClass: 'void-dialog',
    });
    ref.onClose.subscribe(async (file: any) => {
      if (file) {
        const error = await this._user.uploadAvatarImg(file);
        if (error) {
          console.error(error);
        }
      }
    });
  }

  openEditProfileDialog() {
    const ref = (this._dialog as any).open(EditProfileDialog, {
      data: {
        displayName: this.display_name() || '',
        bio: this.bio(),
        discordId: this.discord_id(),
        instagram: this.instagram(),
        facebook: this.facebook(),
        contactEmail: this.contact_email(),
      },
      width: '460px',
      modal: true,
      showHeader: false,
      styleClass: 'void-dialog',
    });
    ref.onClose.subscribe((result: any) => {
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

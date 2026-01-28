import { Component, Signal, computed, inject } from '@angular/core';
import { getAvatarUrl } from '../_helpers/util';
import { PassportService } from '../_services/passport-service';
import { MatDialog } from '@angular/material/dialog';
import { UploadImg } from '../_dialogs/upload-img/upload-img';
import { UserService } from '../_services/user-service';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-profile',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  avatar_url: Signal<string>;
  display_name: Signal<string | undefined>;
  private _passport = inject(PassportService);
  private _dialog = inject(MatDialog);
  private _user = inject(UserService);
  constructor() {
    this.avatar_url = computed(() => this._passport.avatar());
    this.display_name = computed(() => this._passport.data()?.display_name);
  }

  openDialog() {
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
}

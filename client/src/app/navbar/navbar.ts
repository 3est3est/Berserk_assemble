import { Component, computed, inject, Signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { PassportService } from '../_services/passport-service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { getAvatarUrl } from '../_helpers/util';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationBell } from '../_components/notification-bell/notification-bell';
import { OnlineUsers } from '../_components/online-users/online-users';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    NotificationBell,
    OnlineUsers,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private _passport = inject(PassportService);
  display_name: Signal<string | undefined>;
  avatar_url: Signal<string | undefined>;
  _router = inject(Router);

  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name);
    this.avatar_url = computed(() => this._passport.avatar());
  }

  logout() {
    this._passport.destroy();
    this._router.navigate(['/login']);
  }
}

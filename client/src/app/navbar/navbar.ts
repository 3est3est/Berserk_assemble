import { Component, computed, inject, Signal, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { CommonModule } from '@angular/common';
import { OnlineUsers } from '../_components/online-users/online-users';
import { NotificationBell } from '../_components/notification-bell/notification-bell';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule, NotificationBell, OnlineUsers, ButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private _router = inject(Router);
  public _passport = inject(PassportService);

  display_name: Signal<string | undefined>;
  avatar_url: Signal<string | undefined>;

  isDarkMode = signal<boolean>(true);

  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name);
    this.avatar_url = computed(() => {
      const data = this._passport.data();
      if (!data) return undefined;
      return (
        data.avatar_url ||
        `https://ui-avatars.com/api/?name=${data.display_name}&background=random&color=fff`
      );
    });

    // Apply dark theme by default
    this.updateTheme();
  }

  toggleTheme() {
    this.isDarkMode.update((v) => !v);
    this.updateTheme();
  }

  private updateTheme() {
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout() {
    if (confirm('Do you want to disconnect from the network?')) {
      this._passport.destroy();
      this._router.navigate(['/login']);
    }
  }
}

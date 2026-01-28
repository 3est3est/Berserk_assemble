import { Component, inject, Signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private _router = inject(Router);
  private _passport = inject(PassportService);

  display_name: Signal<string | undefined>;
  constructor() {
    this.display_name = computed(() => this._passport.data()?.display_name);
    if (!this._passport.data()) this._router.navigate(['/login']);
  }

  private _http = inject(HttpClient);
  MakeError(code: number) {
    const url = environment.baseUrl + '/api/util/make_error/' + code;
    this._http.get(url).subscribe({
      error: (e) => console.log(e),
    });
  }
}


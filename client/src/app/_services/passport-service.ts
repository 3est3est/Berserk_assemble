import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LoginModel, Passport, RegisterModel } from '../_models/passport';
import { firstValueFrom } from 'rxjs';
import { MatCardLgImage } from '@angular/material/card';
import { getAvatarUrl } from '../_helpers/util';
// import { environment } from '../../environments/environment.development';
@Injectable({
  providedIn: 'root',
})
export class PassportService {
  private _key = 'passport';
  private _base_url = environment.baseUrl + '/api';
  private _http = inject(HttpClient);

  data = signal<undefined | Passport>(undefined);
  avatar = signal<string>('');

  saveAvatarImgUrl(url: string) {
    let passport = this.data();
    if (passport) {
      passport.avatar_url = url;
      this.avatar.set(url);
      this.data.set(passport);
      this.savePassportToLocalStorage();
    }
  }

  private loadPassportFromLocalStorage() {
    const jsonString = localStorage.getItem(this._key);
    if (!jsonString) return 'not found passport';
    try {
      const passport = JSON.parse(jsonString) as Passport;
      this.data.set(passport);
      const avatar = getAvatarUrl(passport);
      this.avatar;
    } catch (error) {
      return `${error}`;
    }
    return null;
  }

  private savePassportToLocalStorage() {
    const passport = this.data();
    if (!passport) return 'not found passport';
    const jsonString = JSON.stringify(passport);
    localStorage.setItem(this._key, jsonString);
    return null;
  }

  constructor() {
    this.loadPassportFromLocalStorage();
  }

  destroy() {
    this.data.set(undefined);
    this.avatar.set('');
    localStorage.removeItem(this._key);
  }

  async get(login: LoginModel): Promise<null | string> {
    try {
      const api_url = this._base_url + '/authentication/login';
      await this.fetchPassport(api_url, login);
    } catch (error) {
      return `${error}`;
    }
    return null;
  }

  async register(register: RegisterModel): Promise<null | string> {
    const api_url = this._base_url + '/brawler/register';
    try {
      await this.fetchPassport(api_url, register);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        return error.error;
      }
      return `${error}`;
    }
    return null;
  }

  private async fetchPassport(
    api_url: string,
    model: LoginModel | RegisterModel,
  ): Promise<string | null> {
    try {
      const result = this._http.post<Passport>(api_url, model);
      const passport = await firstValueFrom(result);
      this.data.set(passport);
      this.savePassportToLocalStorage();
      return null;
    } catch (error: any) {
      console.log(error.error);
      return error.error;
    }
  }
}

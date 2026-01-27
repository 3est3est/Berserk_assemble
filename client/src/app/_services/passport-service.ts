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
  isSignin = signal<boolean>(false);

  saveAvatarImgUrl(url: string) {
    let passport = this.data();
    if (passport) {
      passport.avatar_url = url;
      this.avatar.set(url);
      this.data.set(passport);
      this.savePassportToLocalStorage();
    }
  }

  private loadPassportFromLocalStorage(): string | null {
    const jsonString = localStorage.getItem(this._key);
    if (!jsonString) return 'not found ';
    try {
      const passport = JSON.parse(jsonString) as Passport;
      this.data.set(passport);
      const avatar = getAvatarUrl(passport);
      this.avatar.set(avatar);
      this.isSignin.set(true);
    } catch (error) {
      return `${error}`;
    }
    return null;
  }

  private savePassportToLocalStorage() {
    const passport = this.data();
    if (!passport) return;
    const jsonString = JSON.stringify(passport);
    localStorage.setItem(this._key, jsonString);
    this.isSignin.set(true);
  }

  constructor() {
    this.loadPassportFromLocalStorage();
  }

  destroy() {
    this.data.set(undefined);
    this.avatar.set('');
    this.isSignin.set(false);
    localStorage.removeItem(this._key);
  }

  async get(login: LoginModel): Promise<string | null> {
    const api_url = this._base_url + '/authentication/login';
    return await this.fetchPassport(api_url, login);
  }

  async register(register: RegisterModel): Promise<string | null> {
    const api_url = this._base_url + '/brawler/register';
    return await this.fetchPassport(api_url, register);
  }

  private async fetchPassport(
    api_url: string,
    model: LoginModel | RegisterModel,
  ): Promise<string | null> {
    try {
      const result = this._http.post<Passport>(api_url, model);
      const passport = await firstValueFrom(result);
      this.data.set(passport);
      this.avatar.set(getAvatarUrl(passport)); // เพื่อให้ รูป avatar เปลี่ยนทันที ที่ login ไม่ต้อง รีเฟรชหน้าเว็บ
      this.savePassportToLocalStorage();
      return null;
    } catch (error: any) {
      // console.error(error)
      // console.log(error.error);
      return error.error;
    }
  }
}

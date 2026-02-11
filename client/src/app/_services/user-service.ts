import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { PassportService } from './passport-service';
import { fileToBase64 } from '../_helpers/file';
import { firstValueFrom } from 'rxjs';
import { CloudinaryImage } from '../_models/cloudinary-image';
import { Passport } from '../_models/passport';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _base_url = environment.baseUrl + '/api/brawler';
  private _http = inject(HttpClient);
  private _passport = inject(PassportService);

  async uploadAvatarImg(file: File): Promise<string | null> {
    const url = this._base_url + '/avatar';
    const base64string = await fileToBase64(file); //Fix:
    const uploadImg = {
      base64_string: base64string.split(',')[1],
    };
    try {
      const cloudinaryImg = await firstValueFrom(this._http.post<CloudinaryImage>(url, uploadImg));
      this._passport.saveAvatarImgUrl(cloudinaryImg.url);
    } catch (error: any) {
      return error.error as string;
    }
    return null;
  }

  async updateProfile(
    displayName: string,
    bio?: string,
    discordId?: string,
    contactEmail?: string,
    instagram?: string,
    facebook?: string,
  ): Promise<string | null> {
    const url = this._base_url + '/profile';
    const body = {
      display_name: displayName,
      bio: bio,
      discord_id: discordId,
      contact_email: contactEmail,
      instagram: instagram,
      facebook: facebook,
    };
    try {
      const passport = await firstValueFrom(this._http.patch<Passport>(url, body));
      this._passport.updatePassport(passport);
    } catch (error: any) {
      return error.error as string;
    }
    return null;
  }

  async getProfile(id: number): Promise<any> {
    const url = `${this._base_url}/${id}`;
    return firstValueFrom(this._http.get<any>(url));
  }
}

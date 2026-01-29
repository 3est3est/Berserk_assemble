import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Mission } from '../_models/mission';

@Injectable({
  providedIn: 'root',
})
export class CrewService {
  private _base_url = environment.baseUrl + '/api/crew';
  private _http = inject(HttpClient);

  /**
   * Join a mission
   */
  async join(missionId: number): Promise<string> {
    const url = `${this._base_url}/join/${missionId}`;
    const resp = await firstValueFrom(this._http.post(url, {}, { responseType: 'text' }));
    return resp;
  }

  /**
   * Leave a mission
   */
  async leave(missionId: number): Promise<string> {
    const url = `${this._base_url}/leave/${missionId}`;
    const resp = await firstValueFrom(this._http.delete(url, { responseType: 'text' }));
    return resp;
  }

  /**
   * Get missions user has joined
   */
  async getMyJoinedMissions(): Promise<Mission[]> {
    const url = `${this._base_url}/my-missions`;
    const resp = await firstValueFrom(this._http.get<Mission[]>(url));
    return resp;
  }
}

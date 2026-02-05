import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MissionFilter } from '../_models/mission-filter';
import { firstValueFrom } from 'rxjs';
import { AddMission } from '../_models/add-mission';
import { Mission } from '../_models/mission';
import { MissionComment } from '../_models/mission-comment';

@Injectable({
  providedIn: 'root',
})
export class MissionService {
  //view
  private _base_url = environment.baseUrl + '/api';
  private _op_base_url = environment.baseUrl + '/api/mission';
  private _http = inject(HttpClient);

  filter: MissionFilter = { status: '' };

  async getByFilter(filter: MissionFilter): Promise<Mission[]> {
    const queryString = this.createQueryString(filter);
    const url = this._base_url + '/view/filter?' + queryString;
    const missions = await firstValueFrom(this._http.get<Mission[]>(url));
    return missions;
  }

  async getById(id: number): Promise<Mission> {
    const url = `${this._base_url}/view/${id}`;
    return await firstValueFrom(this._http.get<Mission>(url));
  }

  private createQueryString(filter: MissionFilter): string {
    this.filter = filter;
    const params: string[] = [];

    if (filter.name && filter.name.trim()) {
      params.push(`name=${encodeURIComponent(filter.name.trim())}`);
    }
    if (filter.status) {
      params.push(`status=${encodeURIComponent(filter.status)}`);
    }
    // เพิ่ม exclude_user_id สำหรับกรองภารกิจของตัวเองและที่เข้าร่วมแล้ว
    if (filter.exclude_user_id) {
      params.push(`exclude_user_id=${filter.exclude_user_id}`);
    }

    return params.join('&');
  }

  async add(mission: AddMission): Promise<number> {
    const url = this._base_url + '/mission-management';
    const observable = this._http.post<{ mission_id: number }>(url, mission);
    const resp = await firstValueFrom(observable);
    return resp.mission_id;
  }

  async getMyMissions(): Promise<Mission[]> {
    const url = this._base_url + '/brawler/my-missions';
    const observable = this._http.get<Mission[]>(url);
    const missions = await firstValueFrom(observable);
    return missions;
  }

  async update(id: number, mission: AddMission): Promise<void> {
    const url = `${this._base_url}/mission-management/${id}`;
    await firstValueFrom(this._http.patch(url, mission, { responseType: 'text' }));
  }

  async delete(id: number): Promise<void> {
    const url = `${this._base_url}/mission-management/${id}`;
    await firstValueFrom(this._http.delete(url, { responseType: 'text' }));
  }

  async startMission(id: number): Promise<void> {
    const url = `${this._op_base_url}/in-progress/${id}`;
    await firstValueFrom(this._http.patch(url, {}));
  }

  async completeMission(id: number): Promise<void> {
    const url = `${this._op_base_url}/to-completed/${id}`;
    await firstValueFrom(this._http.patch(url, {}));
  }

  async failMission(id: number): Promise<void> {
    const url = `${this._op_base_url}/to-failed/${id}`;
    await firstValueFrom(this._http.patch(url, {}));
  }

  async kickMember(missionId: number, brawlerId: number): Promise<void> {
    const url = `${this._op_base_url}/kick/${missionId}/${brawlerId}`;
    await firstValueFrom(this._http.patch(url, {}));
  }

  async getCrew(missionId: number): Promise<any[]> {
    const url = `${this._base_url}/view/crew/${missionId}`;
    return await firstValueFrom(this._http.get<any[]>(url));
  }

  async getComments(missionId: number): Promise<MissionComment[]> {
    const url = `${this._base_url}/comment/${missionId}`;
    return await firstValueFrom(this._http.get<MissionComment[]>(url));
  }

  async addComment(missionId: number, content: string): Promise<void> {
    const url = `${this._base_url}/comment/${missionId}`;
    await firstValueFrom(this._http.post(url, { content }, { responseType: 'text' }));
  }

  async clearComments(missionId: number): Promise<void> {
    const url = `${this._base_url}/comment/${missionId}`;
    await firstValueFrom(this._http.delete(url, { responseType: 'text' }));
  }
}

import { Component, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissionService } from '../_services/mission-service';
import { CrewService } from '../_services/crew-service';
import { Mission } from '../_models/mission';

interface MissionStats {
  open: number;
  inProgress: number;
  completed: number;
  failed: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private _missionService = inject(MissionService);
  private _crewService = inject(CrewService);

  stats: MissionStats = {
    open: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  isLoading = true;

  constructor() {
    this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    try {
      // 1. Get missions I own (Chief)
      const myMissions = await this._missionService.getMyMissions();

      // 2. Get missions I joined (Crew)
      const joinedMissions = await this._crewService.getMyJoinedMissions();

      // 3. Combine unique missions (just in case)
      const allMissions = [...myMissions, ...joinedMissions];
      // Use Map to remove duplicates by ID
      const uniqueMissions = Array.from(
        new Map(allMissions.map((item) => [item.id, item])).values(),
      );

      // 4. Calculate stats
      this.calculateStats(uniqueMissions);
    } catch (e) {
      console.error('Failed to load dashboard stats', e);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateStats(missions: Mission[]) {
    this.stats = {
      open: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      total: missions.length,
    };

    missions.forEach((m) => {
      switch (m.status) {
        case 'Open':
          this.stats.open++;
          break;
        case 'InProgress':
          this.stats.inProgress++;
          break;
        case 'Completed':
          this.stats.completed++;
          break;
        case 'Failed':
          this.stats.failed++;
          break;
      }
    });
  }
}

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class Dashboard implements OnInit {
  private _missionService = inject(MissionService);
  private _crewService = inject(CrewService);
  private _cdr = inject(ChangeDetectorRef);

  stats: MissionStats = {
    open: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  isLoading = true;

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;

    // Initialize arrays
    let myMissions: Mission[] = [];
    let joinedMissions: Mission[] = [];

    // 1. Get missions I own (Chief)
    try {
      myMissions = await this._missionService.getMyMissions();
    } catch (e) {
      console.error('Failed to load my missions', e);
    }

    // 2. Get missions I joined (Crew)
    try {
      joinedMissions = await this._crewService.getMyJoinedMissions();
    } catch (e) {
      console.error('Failed to load joined missions', e);
    }

    try {
      // 3. Combine unique missions (just in case)
      const allMissions = [...myMissions, ...joinedMissions];
      // Use Map to remove duplicates by ID
      const uniqueMissions = Array.from(
        new Map(allMissions.map((item) => [item.id, item])).values(),
      );

      // 4. Calculate stats
      console.log('Unique missions:', uniqueMissions);
      this.calculateStats(uniqueMissions);
      this._cdr.detectChanges(); // Force update to fix NG0100
    } catch (e) {
      console.error('Failed to calculate stats', e);
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
      console.log(`Processing mission ${m.id} status: "${m.status}"`);
      // Use case-insensitive matching
      const status = m.status.toLowerCase(); // Convert to lower case for comparison
      switch (status) {
        case 'open':
          this.stats.open++;
          break;
        case 'inprogress':
        case 'in-progress': // Handle potential variations
          this.stats.inProgress++;
          break;
        case 'completed':
          this.stats.completed++;
          break;
        case 'failed':
          this.stats.failed++;
          break;
        default:
          console.warn(`Unknown status "${m.status}" for mission:`, m);
      }
    });
    console.log('Final stats:', this.stats);
  }
}

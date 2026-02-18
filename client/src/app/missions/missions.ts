import { Component, computed, inject, Signal, OnDestroy } from '@angular/core';
import { MissionService } from '../_services/mission-service';
import { MissionFilter } from '../_models/mission-filter';
import { FormsModule } from '@angular/forms';
import { Mission } from '../_models/mission';
import { PassportService } from '../_services/passport-service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CrewService } from '../_services/crew-service';
import { getUserIdFromToken } from '../_helpers/util';
import { ToastService } from '../_services/toast-service';
import { WebsocketService } from '../_services/websocket-service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-missions',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    RouterLink,
    RouterModule,
  ],
  templateUrl: './missions.html',
  styleUrl: './missions.scss',
})
export class Missions implements OnDestroy {
  private _mission = inject(MissionService);
  private _crewService = inject(CrewService);
  private _passportService = inject(PassportService);
  private _toast = inject(ToastService);
  private _wsService = inject(WebsocketService);

  private _allMissions: Mission[] = [];
  filteredMissions: Mission[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  showAvailableOnly: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 6;
  paginatedMissions: Mission[] = [];

  categories = [
    { name: 'Sports & Active', emoji: '⚽' },
    { name: 'Social & Chill', emoji: '🍹' },
    { name: 'Gaming & E-Sports', emoji: '🎮' },
    { name: 'Entertainment', emoji: '🍿' },
    { name: 'Travel & Trip', emoji: '✈️' },
    { name: 'Lifestyle & Hobby', emoji: '🎨' },
    { name: 'Other', emoji: '✨' },
  ];

  statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Failed', value: 'Failed' },
  ];

  isSignin: Signal<boolean>;
  private _wsSubscription?: Subscription;

  constructor() {
    this.isSignin = computed(() => this._passportService.isSignin());
    this.initialLoad();
    this.setupRealtimeUpdates();
  }

  ngOnDestroy(): void {
    this._wsSubscription?.unsubscribe();
  }

  private async initialLoad() {
    await this.onSubmit();
  }

  private setupRealtimeUpdates() {
    this._wsSubscription = this._wsService.notifications$.subscribe((msg) => {
      const reloadTypes = [
        'new_crew_joined',
        'crew_left',
        'mission_started',
        'mission_completed',
        'mission_failed',
        'mission_deleted',
        'kicked_from_mission',
      ];
      if (reloadTypes.includes(msg.type)) {
        this.onSubmit();
      }
    });
  }

  async onSubmit() {
    const filter: MissionFilter = { status: '', category: '' };
    const passport = this._passportService.data();
    if (passport) {
      const userId = getUserIdFromToken(passport.token);
      if (userId) filter.exclude_user_id = userId.toString();
    }

    this._allMissions = await this._mission.getByFilter(filter);
    this.filterMissions();
  }

  filterMissions() {
    this.currentPage = 1; // Reset to first page on filter change
    this._runFiltering();
  }

  private _runFiltering() {
    this.filteredMissions = this._allMissions.filter((m) => {
      const matchesSearch =
        !this.searchTerm ||
        m.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.chief_display_name.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = !this.selectedCategory || m.category === this.selectedCategory;
      const matchesStatus = !this.selectedStatus || m.status === this.selectedStatus;

      const isNotFull = m.crew_count < m.max_crew;
      const matchesAvailability = !this.showAvailableOnly || isNotFull;

      return matchesSearch && matchesCategory && matchesStatus && matchesAvailability;
    });
    this.updatePaginatedMissions();
  }

  updatePaginatedMissions() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedMissions = this.filteredMissions.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    // Basic pages + 1 extra page to always have a "Next" available for Discovery vibe
    const basePages = Math.ceil(this.filteredMissions.length / this.pageSize);
    return Math.max(1, basePages + 1);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedMissions();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedMissions();
    }
  }

  async onJoin(mission: Mission) {
    if (!confirm(`Do you want to join "${mission.name}"?`)) return;
    try {
      await this._crewService.join(mission.id);
      this.onSubmit();
    } catch (e: any) {
      this._toast.error('Failed to join: ' + (e.error || e.message));
    }
  }
}

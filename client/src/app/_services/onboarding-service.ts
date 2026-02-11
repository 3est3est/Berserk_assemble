import { Injectable } from '@angular/core';

export interface GuideStep {
  elementId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly STORAGE_KEY = 'berserk_onboarding_completed';

  // Check if a specific page's tutorial is completed
  isCompleted(page: string): boolean {
    const completed = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    return !!completed[page];
  }

  // Mark a page's tutorial as completed
  markAsCompleted(page: string): void {
    const completed = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    completed[page] = true;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(completed));
  }

  // Reset all (for testing)
  reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

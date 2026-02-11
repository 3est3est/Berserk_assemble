import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuideStep } from '../../_services/onboarding-service';

@Component({
  selector: 'app-guide-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guide-overlay.html',
  styleUrl: './guide-overlay.scss',
})
export class GuideOverlay implements OnInit {
  @Input() steps: GuideStep[] = [];
  @Output() completed = new EventEmitter<void>();

  active = false;
  currentIndex = 0;

  // Visual properties
  spotlightTop = 0;
  spotlightLeft = 0;
  spotlightWidth = 0;
  spotlightHeight = 0;
  cardTop = 0;
  cardLeft = 0;

  get currentStep(): GuideStep {
    return this.steps[this.currentIndex];
  }

  ngOnInit() {
    if (this.steps.length > 0) {
      this.start();
    }
  }

  start() {
    this.active = true;
    this.currentIndex = 0;
    setTimeout(() => this.updateSpotlight(), 100);
  }

  next() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.updateSpotlight();
    } else {
      this.finish();
    }
  }

  finish() {
    this.active = false;
    this.completed.emit();
  }

  private updateSpotlight() {
    const el = document.getElementById(this.currentStep.elementId);
    if (!el) {
      console.warn(`Element with ID ${this.currentStep.elementId} not found`);
      this.next(); // Skip to next if element missing
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 10;

    this.spotlightTop = rect.top - padding;
    this.spotlightLeft = rect.left - padding;
    this.spotlightWidth = rect.width + padding * 2;
    this.spotlightHeight = rect.height + padding * 2;

    // Calculate card position based on step preference
    switch (this.currentStep.position) {
      case 'bottom':
        this.cardTop = this.spotlightTop + this.spotlightHeight + 20;
        this.cardLeft = this.spotlightLeft;
        break;
      case 'top':
        this.cardTop = this.spotlightTop - 180; // Estimated height
        this.cardLeft = this.spotlightLeft;
        break;
      case 'right':
        this.cardTop = this.spotlightTop;
        this.cardLeft = this.spotlightLeft + this.spotlightWidth + 20;
        break;
      case 'left':
        this.cardTop = this.spotlightTop;
        this.cardLeft = this.spotlightLeft - 300;
        break;
    }

    // Keep within screen bounds
    this.cardLeft = Math.max(20, Math.min(this.cardLeft, window.innerWidth - 300));
    this.cardTop = Math.max(20, Math.min(this.cardTop, window.innerHeight - 200));
  }
}

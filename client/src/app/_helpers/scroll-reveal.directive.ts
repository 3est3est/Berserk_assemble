import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

/**
 * vibeReveal — Scroll Reveal Directive
 * Adds 'reveal-visible' class when element enters viewport.
 * CSS: .reveal-hidden { opacity: 0; transform: translateY(24px); }
 *      .reveal-visible { opacity: 1; transform: translateY(0); }
 */
@Directive({
  selector: '[vibeReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    this.renderer.addClass(this.el.nativeElement, 'reveal-hidden');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.renderer.removeClass(this.el.nativeElement, 'reveal-hidden');
          this.renderer.addClass(this.el.nativeElement, 'reveal-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(this.el.nativeElement);
  }
}

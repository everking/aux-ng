import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appSwipeBrowse]'
})
export class SwipeBrowseDirective {
  @Input() swipeDisabled = false;
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  private startX = 0;
  private startY = 0;
  private tracking = false;

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (this.swipeDisabled) {
      return;
    }
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      return;
    }
    this.tracking = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (!this.tracking) {
      return;
    }
    this.tracking = false;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) {
      return;
    }
    if (dx < 0) {
      this.swipeLeft.emit();
    } else {
      this.swipeRight.emit();
    }
  }
}

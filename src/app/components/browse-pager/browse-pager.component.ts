import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { BrowseListService } from '../../services/browse-list.service';

@Component({
  selector: 'app-browse-pager',
  imports: [NgIf],
  templateUrl: './browse-pager.component.html',
  styleUrl: './browse-pager.component.scss'
})
export class BrowsePagerComponent {
  @Input({ required: true }) currentId = '';
  @Input() busy = false;
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  constructor(private browse: BrowseListService) {}

  get prevItem() {
    return this.browse.neighbors(this.currentId).prev;
  }

  get nextItem() {
    return this.browse.neighbors(this.currentId).next;
  }

  get visible(): boolean {
    return !!(this.prevItem || this.nextItem);
  }

  goPrev(): void {
    if (this.busy || !this.prevItem) {
      return;
    }
    this.previous.emit();
  }

  goNext(): void {
    if (this.busy || !this.nextItem) {
      return;
    }
    this.next.emit();
  }
}

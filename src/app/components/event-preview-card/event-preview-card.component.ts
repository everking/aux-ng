import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgIf, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrowseListService } from '../../services/browse-list.service';
import { stripHtml } from '../../utils';
import {
  BulletinEvent,
  EventStatus,
  eventDateLabel,
  getEventStatus
} from '../../interfaces/bulletin-event';

@Component({
  selector: 'app-event-preview-card',
  imports: [
    MatCardModule,
    NgIf,
    SlicePipe,
    RouterLink
  ],
  templateUrl: './event-preview-card.component.html',
  styleUrl: './event-preview-card.component.scss'
})
export class EventPreviewCardComponent implements OnInit {
  @Input() event!: BulletinEvent;
  @Input() listIds: string[] = [];
  @Input() parentUrl = '/events';
  strippedBody = '';
  dateRange = '';
  status: EventStatus = 'upcoming';

  constructor(private browse: BrowseListService) {}

  ngOnInit() {
    this.strippedBody = stripHtml(this.event?.body);
    this.dateRange = eventDateLabel(this.event);
    this.status = getEventStatus(this.event);
  }

  get statusLabel(): string {
    return this.status === 'happening' ? 'Happening now' : 'Upcoming';
  }

  rememberList(): void {
    const ids = this.listIds.length ? this.listIds : [this.event.eventId];
    this.browse.remember('event', ids, this.parentUrl);
  }
}

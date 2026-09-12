import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { EventService } from '../../services/event.service';
import { ArticleService } from '../../services/article.service';
import { BulletinEvent, sortCurrentEvents } from '../../interfaces/bulletin-event';
import { EventPreviewCardComponent } from '../../components/event-preview-card/event-preview-card.component';

@Component({
  selector: 'app-events',
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    RouterModule,
    MatButton,
    MatProgressSpinner,
    EventPreviewCardComponent
  ],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss'
})
export class EventsComponent implements OnInit {
  events: BulletinEvent[] = [];
  loading = true;
  loadFailed = false;

  constructor(
    private eventService: EventService,
    private articleService: ArticleService
  ) {}

  async ngOnInit() {
    this.articleService.setCurrentCategory('');
    try {
      const allEvents = await this.eventService.fetchEvents();
      this.events = sortCurrentEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      this.loadFailed = true;
    } finally {
      this.loading = false;
    }
  }
}

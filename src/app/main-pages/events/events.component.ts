import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { EventService } from '../../services/event.service';
import { ArticleService } from '../../services/article.service';
import { TagCatalogService } from '../../services/tag-catalog.service';
import {
  BulletinEvent,
  filterEventsByTags,
  sortCurrentEvents
} from '../../interfaces/bulletin-event';
import { EventPreviewCardComponent } from '../../components/event-preview-card/event-preview-card.component';
import { normalizeTags } from '../../utils';

export const EVENT_TAG_FILTER_KEY = 'auxilium.eventTagFilter';

interface EventTagFilter {
  all: boolean;
  selected: string[];
}

@Component({
  selector: 'app-events',
  imports: [
    CommonModule,
    FormsModule,
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
  allTags = true;
  selected: Record<string, boolean> = {};
  availableTags: string[] = [];

  constructor(
    private eventService: EventService,
    private articleService: ArticleService,
    private tagCatalog: TagCatalogService
  ) {}

  get selectedTagList(): string[] {
    return this.availableTags.filter((tag) => this.selected[tag]);
  }

  get displayedEvents(): BulletinEvent[] {
    if (this.allTags) {
      return this.events;
    }
    return filterEventsByTags(this.events, this.selectedTagList);
  }

  async ngOnInit() {
    this.articleService.setCurrentCategory('');
    this.restoreFilter();
    try {
      const allEvents = await this.eventService.fetchEvents();
      this.events = sortCurrentEvents(allEvents);
      this.availableTags = this.collectAvailableTags(this.events);
    } catch (error) {
      console.error('Error loading events:', error);
      this.loadFailed = true;
    } finally {
      this.loading = false;
    }
  }

  onAllTagsChange(checked: boolean) {
    this.allTags = checked;
    if (checked) {
      this.selected = {};
    }
    this.persistFilter();
  }

  onTagChange(tag: string, checked: boolean) {
    this.selected = { ...this.selected, [tag]: checked };
    this.persistFilter();
  }

  private collectAvailableTags(events: BulletinEvent[]): string[] {
    const fromEvents = events.flatMap((event) => event.tags || []);
    return normalizeTags([...this.tagCatalog.getAvailable(), ...fromEvents]);
  }

  private persistFilter() {
    const state: EventTagFilter = {
      all: this.allTags,
      selected: this.allTags ? [] : this.selectedTagList
    };
    localStorage.setItem(EVENT_TAG_FILTER_KEY, JSON.stringify(state));
  }

  private restoreFilter() {
    try {
      const raw = localStorage.getItem(EVENT_TAG_FILTER_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as EventTagFilter;
      this.allTags = parsed.all !== false;
      this.selected = {};
      if (!this.allTags) {
        (parsed.selected || []).forEach((tag) => {
          this.selected[tag] = true;
        });
      }
    } catch {
      this.allTags = true;
      this.selected = {};
    }
  }
}

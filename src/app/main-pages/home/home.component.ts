import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ArticleService } from '../../services/article.service';
import { RouterModule } from '@angular/router';
import { BrowseListService } from '../../services/browse-list.service';
import { EventService } from '../../services/event.service';
import {
  BulletinEvent,
  formatDateRange,
  upcomingEventsForHome
} from '../../interfaces/bulletin-event';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgIf, NgFor, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  rosaryInfo = '';
  todaysMysteries = '';
  happeningEvents: BulletinEvent[] = [];

  constructor(
    private articleService: ArticleService,
    private eventService: EventService,
    private browse: BrowseListService
  ) {}

  rememberHappening(): void {
    this.browse.remember(
      'event',
      this.happeningEvents.map((event) => event.eventId),
      '/home'
    );
  }

  rememberRosary(): void {
    this.browse.remember('article', [this.todaysMysteries], '/home');
  }

  eventDate(event: BulletinEvent): string {
    return formatDateRange(event.dateFrom, event.dateTo);
  }

  async ngOnInit() {
    interface Mystery {
      name: string;
      link: string;
    }

    const mysteries: Record<string, Mystery> = {
      Sunday: {
        name: 'Glorious Mysteries',
        link: 'glorious-mysteries'
      },
      Monday: {
        name: 'Joyful Mysteries',
        link: 'joyful-mysteries'
      },
      Tuesday: {
        name: 'Sorrowful Mysteries',
        link: 'sorrowful-mysteries'
      },
      Wednesday: {
        name: 'Glorious Mysteries',
        link: 'glorious-mysteries'
      },
      Thursday: {
        name: 'Luminous Mysteries',
        link: 'luminous-mysteries'
      },
      Friday: {
        name: 'Sorrowful Mysteries',
        link: 'sorrowful-mysteries'
      },
      Saturday: {
        name: 'Joyful Mysteries',
        link: 'joyful-mysteries'
      }
    };
    this.articleService.setCurrentCategory('');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', options);
    this.rosaryInfo = mysteries[dayName].name;
    this.todaysMysteries = mysteries[dayName].link;

    try {
      const events = await this.eventService.fetchEvents();
      this.happeningEvents = upcomingEventsForHome(events);
    } catch (error) {
      console.error('Error loading home events:', error);
      this.happeningEvents = [];
    }
  }
}

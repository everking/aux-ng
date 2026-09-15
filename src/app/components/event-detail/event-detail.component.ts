import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { LoginService } from '../../services/login.service';
import { EventService } from '../../services/event.service';
import { PushService } from '../../services/push.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  BulletinEvent,
  EventStatus,
  eventDateLabel,
  getEventStatus
} from '../../interfaces/bulletin-event';
import { ArticleService } from '../../services/article.service';
import { BackLinkComponent } from '../back-link/back-link.component';
import { BrowsePagerComponent } from '../browse-pager/browse-pager.component';
import { SwipeBrowseDirective } from '../../directives/swipe-browse.directive';
import { BrowseListService } from '../../services/browse-list.service';

@Component({
  selector: 'app-event-detail',
  imports: [
    NgIf,
    NgFor,
    MatProgressSpinner,
    RouterModule,
    BackLinkComponent,
    BrowsePagerComponent,
    SwipeBrowseDirective
  ],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss'
})
export class EventDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  event: BulletinEvent | null = null;
  eventId = '';
  isLoggedIn = false;
  editLink = '';
  notFound = false;
  private externalLinkCheck = false;
  safeBodyHtml: SafeHtml | null = null;
  dateRange = '';
  status: EventStatus = 'upcoming';
  deleting = false;
  deleteMessage = '';
  pushEnabled = false;
  reminderOn = false;
  reminderBusy = false;
  reminderMessage = '';
  loading = true;
  private pushSub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private loginService: LoginService,
    private eventService: EventService,
    private articleService: ArticleService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
    private router: Router,
    private pushService: PushService,
    private browse: BrowseListService
  ) {}

  ngAfterViewChecked() {
    setTimeout(() => this.updateExternalLinks(), 0);
  }

  async onDelete() {
    if (!this.event || this.deleting) {
      return;
    }
    const confirmed = window.confirm('Delete this event? It will be removed from the Events board.');
    if (!confirmed) {
      return;
    }
    this.deleting = true;
    this.deleteMessage = '';
    const deleted = await this.eventService.deleteEvent(this.event);
    if (deleted) {
      await this.router.navigate(['/events']);
      return;
    }
    this.deleting = false;
    this.deleteMessage = 'Sorry. Not deleted.';
  }

  get statusLabel(): string {
    if (this.status === 'happening') {
      return 'Happening now';
    }
    if (this.status === 'ended') {
      return 'This event has ended';
    }
    return 'Upcoming';
  }

  private updateExternalLinks() {
    if (this.externalLinkCheck) {
      return;
    }
    const container: HTMLElement = this.elRef.nativeElement.querySelector('.article');
    if (container) {
      this.externalLinkCheck = true;
      const links: NodeListOf<HTMLAnchorElement> = container.querySelectorAll("a[href^='http']");
      links.forEach((link) => {
        if (!link.href.includes(location.hostname)) {
          this.renderer.setAttribute(link, 'target', '_blank');
          this.renderer.setAttribute(link, 'rel', 'noopener noreferrer');
        }
      });
    }
  }

  get canRemind(): boolean {
    return this.pushEnabled && this.status !== 'ended';
  }

  get remindLabel(): string {
    if (this.reminderOn) {
      return 'Reminder on';
    }
    return 'Remind me';
  }

  get remindHint(): string {
    if (this.status === 'ended') {
      return '';
    }
    if (this.pushEnabled) {
      return this.reminderOn
        ? 'We will notify you the day before and the day of this event.'
        : 'Get a notification the day before and the day of this event.';
    }
    if (this.pushService.isNative()) {
      return 'Enable notifications in iOS Settings → Auxilium, then return here.';
    }
    return 'Reminders are available in the Auxilium iPhone app after you allow notifications.';
  }

  ngOnDestroy(): void {
    this.pushSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  goPrev(): void {
    this.navigateNeighbor(-1);
  }

  goNext(): void {
    this.navigateNeighbor(1);
  }

  private navigateNeighbor(direction: -1 | 1): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    if (!this.browse.goNeighbor(this.eventId, direction)) {
      this.loading = false;
    }
  }

  async onRemindToggle(): Promise<void> {
    if (!this.event || !this.canRemind || this.reminderBusy) {
      return;
    }
    this.reminderBusy = true;
    this.reminderMessage = '';
    const next = !this.reminderOn;
    const ok = await this.pushService.setReminder(this.event, next);
    this.reminderBusy = false;
    if (!ok) {
      this.reminderMessage = next ? 'Could not set reminder.' : 'Could not remove reminder.';
      return;
    }
    this.reminderOn = next;
  }

  async ngOnInit() {
    this.articleService.setCurrentCategory('');
    this.isLoggedIn = this.loginService.isLoggedIn();
    this.pushSub = this.pushService.enabled$.subscribe((enabled) => {
      this.pushEnabled = enabled;
    });
    void this.pushService.enroll({ prompt: false });
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const eventId = params.get('eventId') || '';
      void this.loadEvent(eventId);
    });
  }

  private async loadEvent(eventId: string): Promise<void> {
    this.loading = true;
    this.eventId = eventId;
    this.editLink = `/edit-event/${this.eventId}`;
    this.notFound = false;
    this.externalLinkCheck = false;
    this.reminderMessage = '';
    try {
      const event = await this.eventService.fetchEvent(this.eventId);
      this.event = event;
      if (!this.event) {
        this.notFound = true;
        return;
      }
      this.dateRange = eventDateLabel(this.event);
      this.status = getEventStatus(this.event);
      this.reminderOn = this.pushService.hasReminder(this.event.eventId);
      this.safeBodyHtml = this.event.body
        ? this.sanitizer.bypassSecurityTrustHtml(this.convertYoutubeLinks(this.event.body))
        : null;
    } finally {
      this.loading = false;
      this.browse.doneNavigating();
    }
  }

  convertYoutubeLinks(html: string): string {
    const anchorRegex = /<a\s+[^>]*href=["'](?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s"']*)["'][^>]*>.*?<\/a>/g;
    const rawLinkRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s<]*)/g;
    const renderIframe = (videoId: string): string => `
      <div class="youtube-embed">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          frameborder="0" allowfullscreen></iframe>
      </div>`;

    html = html.replace(anchorRegex, (_, videoId) => renderIframe(videoId));
    html = html.replace(rawLinkRegex, (...args) => {
      return renderIframe(args[1]);
    });

    const aTagMap: Record<string, string> = {};
    let counter = 0;
    html = html.replace(/<a\b[^>]*>.*?<\/a>/gi, (match) => {
      const key = `__ATAG_${counter++}__`;
      aTagMap[key] = match;
      return key;
    });

    html = html.replace(/(^|[^"'=])((https?:\/\/[^\s<>"']+))/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank">${url}</a>`;
    });

    Object.keys(aTagMap).forEach((key) => {
      html = html.replace(key, aTagMap[key]);
    });

    return html;
  }
}

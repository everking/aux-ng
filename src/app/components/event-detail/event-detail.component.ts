import { AfterViewChecked, Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { LoginService } from '../../services/login.service';
import { EventService } from '../../services/event.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  BulletinEvent,
  EventStatus,
  eventDateLabel,
  getEventStatus
} from '../../interfaces/bulletin-event';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-event-detail',
  imports: [
    NgIf,
    NgFor,
    MatProgressSpinner,
    RouterModule
  ],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss'
})
export class EventDetailComponent implements OnInit, AfterViewChecked {
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

  constructor(
    private route: ActivatedRoute,
    private loginService: LoginService,
    private eventService: EventService,
    private articleService: ArticleService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
    private router: Router
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

  async ngOnInit() {
    this.articleService.setCurrentCategory('');
    this.isLoggedIn = this.loginService.isLoggedIn();
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.editLink = `/edit-event/${this.eventId}`;
    this.event = await this.eventService.fetchEvent(this.eventId);
    if (!this.event) {
      this.notFound = true;
      return;
    }
    this.dateRange = eventDateLabel(this.event);
    this.status = getEventStatus(this.event);
    if (this.event.body) {
      this.safeBodyHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.convertYoutubeLinks(this.event.body)
      );
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

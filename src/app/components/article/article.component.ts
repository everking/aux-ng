import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { NgIf } from "@angular/common";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Article, ArticleState } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";
import { LoginService } from '../../services/login.service';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-article',
  imports: [
    NgIf,
    MatProgressSpinner,
    RouterModule
  ],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss'
})
export class ArticleComponent implements OnInit {
  article!: Article | null | undefined;
  articleId: string = '';
  isLoggedIn: boolean = false;
  isPreview: boolean = false;
  editLink: string = '';
  externalLinkCheck: boolean = false;
  state: ArticleState = ArticleState.ACTIVE;
  private observer!: MutationObserver; 
  safeBodyHtml: SafeHtml | null = null;
  lastUpdated: string = '';
  timestamp: string = '';
  previewToggleText: string = 'Preview';

  constructor(
    private route: ActivatedRoute,
    private loginService: LoginService,
    private articleService: ArticleService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
  }

  ngAfterViewChecked() {
    setTimeout(() => this.updateExternalLinks(), 0);
  }

  public previewArticle() {
    if (this.isPreview) {
      this.router.navigate([`/article/${this.articleId}`]);
    } else {
      this.router.navigate([`/preview/${this.articleId}`]);
    }
  }

  public isOld(): boolean {
    return this.articleService.isOld(this.articleId);
  }

  public getStatusImage() {
    if (this.isOld()) {
      return "/assets/images/warn-16.png"
    } else {
      return "/assets/images/ok-16.png"
    }
  }

  private updateExternalLinks() {
    if (this.externalLinkCheck) {
      return;
    }
    const container: HTMLElement = this.elRef.nativeElement.querySelector('.article');
    if (container) {
      this.externalLinkCheck = true;
      const links: NodeListOf<HTMLAnchorElement> = container.querySelectorAll("a[href^='http']");
      links.forEach(link => {
        if (!link.href.includes(location.hostname)) { // Ensure it's an external link
          this.renderer.setAttribute(link, "target", "_blank");
          this.renderer.setAttribute(link, "rel", "noopener noreferrer");
        }
      });
    }
  }

  getUserFriendlyLastUpdated(timestamp?: string): string {
    if (!timestamp) {
      return '';
    }

    const now = new Date();
    const updated = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - updated.getTime()) / 1000);
  
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];
  
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `Last updated: ${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
  
    return 'just now';
  }

  async ngOnInit() {
    this.isLoggedIn = this.loginService.isLoggedIn();
    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    this.state = this.route.snapshot.data['state'] || ArticleState.ACTIVE;
    this.isPreview = this.state === ArticleState.PREVIEW;
    this.previewToggleText = this.isPreview ? 'Live' : 'Preview';
    this.editLink = `/edit-article/${this.articleId}`;
    this.article = await this.articleService.getArticle(this.articleId, this.state);
    if (this.article?.body) {
      this.safeBodyHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.convertYoutubeLinks(this.article.body)
      );
    }
    this.timestamp = this.article?.meta.lastUpdated || '';
    this.lastUpdated = this.getUserFriendlyLastUpdated(this.article?.meta.lastUpdated) || '';

    this.route.params.subscribe(params => {
      this.articleId = params['articleId'];
    });
    this.articleService.setCurrentCategory(this.article?.meta.category || "");
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
      return renderIframe(args[1]); // args[1] = videoId
    });

    const aTagMap: Record<string, string> = {};
    let counter = 0;
    html = html.replace(/<a\b[^>]*>.*?<\/a>/gi, (match) => {
      const key = `__ATAG_${counter++}__`;
      aTagMap[key] = match;
      return key;
    });

    html = html.replace(/(^|[^"'=])((https?:\/\/[^\s<>"']+))/g, (match, prefix, url) => {
      // Don't change it if it's already inside an anchor or another HTML tag
      return `${prefix}<a href="${url}" target="_blank">${url}</a>`;
    });

    Object.keys(aTagMap).forEach((key) => {
      html = html.replace(key, aTagMap[key]);
    });
    
    return html;
  }
}

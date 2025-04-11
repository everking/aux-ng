import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { NgIf } from "@angular/common";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Article } from "../../interfaces/article";
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
  article!: Article | null;
  articleId: string = '';
  isLoggedIn: boolean = false;
  editLink: string = '';
  externalLinkCheck: boolean = false;
  isPreview: boolean = false;
  private observer!: MutationObserver; 
  safeBodyHtml: SafeHtml | null = null;

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
    this.router.navigate([`/preview/${this.articleId}`]);
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

  async ngOnInit() {
    this.isLoggedIn = this.loginService.isLoggedIn();
    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    this.isPreview = this.route.snapshot.data['preview'] || false;
    this.editLink = `/edit-article/${this.articleId}`;
    if (this.isPreview) {
      if (this.articleService.getCachedArticle(this.articleId) === undefined) {
        const cachedArticle = await this.articleService.fetchArticle(this.articleId, false);
        if (cachedArticle) {
          this.articleService.setCachedArticle(this.articleId, cachedArticle);
        }
      }
    }
    this.article = await this.articleService.fetchArticle(this.articleId, this.isPreview);
    if (this.article?.body) {
      this.safeBodyHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.convertYoutubeLinks(this.article.body)
      );
    }

    this.route.params.subscribe(params => {
      this.articleId = params['articleId'];
      this.initPreview(this.articleId);
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

  async initPreview(articleId: string) {
    this.article = await this.articleService.fetchArticle(articleId, this.isPreview);    
  }
}

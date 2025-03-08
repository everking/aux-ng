import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { NgIf } from "@angular/common";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Article } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";
import { LoginService } from '../../services/login.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import e from 'express';

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

  ngAfterViewChecked() {
    setTimeout(() => this.updateExternalLinks(), 0);
  }

  public getLatestArticle() {
    this.articleService.fetchArticle(this.articleId, true).then((article: Article|null) => {
      this.article = article;
    });
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

  constructor(
    private route: ActivatedRoute,
    private loginService: LoginService,
    private articleService: ArticleService,
    private elRef: ElementRef,
    private renderer: Renderer2) {
  }

  async ngOnInit() {
    this.isLoggedIn = this.loginService.isLoggedIn();
    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    this.isPreview = this.route.snapshot.data['preview'] || false;
    this.editLink = `/edit-article/${this.articleId}`;
    this.article = await this.articleService.fetchArticle(this.articleId, this.isPreview);
    console.log(`body: ${this.article?.body}`);
    this.route.params.subscribe(params => {
      this.articleId = params['articleId'];
      this.initPreview(this.articleId);
    });
  }

  async initPreview(articleId: string) {
    console.log("initPreview")
    this.article = await this.articleService.fetchArticle(articleId, this.isPreview);    
  }
}

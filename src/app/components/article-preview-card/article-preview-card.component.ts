import { Component, Input } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { NgFor, NgIf, SlicePipe, UpperCasePipe } from "@angular/common";
import { Article, ArticleState } from "../../interfaces/article";
import { RouterLink } from "@angular/router";
import { BrowseListService } from '../../services/browse-list.service';
import { stripHtml } from '../../utils';
import { ArticleService } from '../../services/article.service';

@Component({
    selector: 'app-article-preview-card',
    imports: [
        MatCardModule,
        UpperCasePipe,
        NgFor,
        NgIf,
        SlicePipe,
        RouterLink,
    ],
    templateUrl: './article-preview-card.component.html',
    styleUrl: './article-preview-card.component.scss'
})
export class ArticlePreviewCardComponent {
  @Input() articleId!: string;
  @Input() listIds: string[] = [];
  @Input() parentUrl = '/home';
  article:Article|null|undefined = null;

  constructor(
    private articleService: ArticleService,
    private browse: BrowseListService
  ) {}
  public strippedBody: string = '';
  async ngOnInit() {
    this.article = await this.articleService.getArticle(this.articleId, ArticleState.ACTIVE);
    this.strippedBody = stripHtml(this.article?.body);
  }

  rememberList(): void {
    const ids = this.listIds.length ? this.listIds : [this.articleId];
    this.browse.remember('article', ids, this.parentUrl);
  }
}

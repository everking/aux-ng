import { Component, Input } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { SlicePipe, UpperCasePipe } from "@angular/common";
import { Article } from "../../interfaces/article";
import { RouterLink } from "@angular/router";
import { stripHtml } from '../../utils';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-preview-card',
  standalone: true,
  imports: [
    MatCardModule,
    UpperCasePipe,
    SlicePipe,
    RouterLink,
  ],
  templateUrl: './article-preview-card.component.html',
  styleUrl: './article-preview-card.component.scss'
})
export class ArticlePreviewCardComponent {
  @Input() articleId!: string;
  article:Article|null = null;

  constructor(private articleService: ArticleService) {

  }
  public strippedBody: string = '';
  async ngOnInit() {
    this.article = await this.articleService.fetchLocalArticle(this.articleId);
    this.strippedBody = stripHtml(this.article?.body);
  }
}

import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Article } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ArticlePreviewCardComponent } from "../article-preview-card/article-preview-card.component";

@Component({
  selector: 'app-article-list',
  imports: [
    NgForOf,
    ArticlePreviewCardComponent,
    CommonModule,
    NgIf,
    MatProgressSpinner,
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss'
})
export class ArticleListComponent implements OnChanges {
  @Input() articles!: Article[];
  @Input() maxArticles: number = 5;
  @Input() maxArticlesPerRow: number = 2;
  @Input() category = "home";
  subCategories:Array<{ key: string; name: string; summary: string; articles: string[] }> = [];

  constructor(public articleService: ArticleService) {
  }

  ngOnChanges() {
    if (this.category) {
      this.subCategories = this.articleService.getSubCategories(this.category);
    }
  }

  trackByHeader(index: number, article: Article): string|undefined {
    return article.header;
  }

  private spliceArticles(articles: Article[]): Article[] {
    return articles;
  }
}

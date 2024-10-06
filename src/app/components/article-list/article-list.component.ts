import { Component, Input, OnInit } from '@angular/core';
import { Article } from "../../interfaces/article";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { ArticleService } from "../../services/article.service";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ArticlePreviewCardComponent } from "../article-preview-card/article-preview-card.component";

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    NgForOf,
    ArticlePreviewCardComponent,
    NgIf,
    MatProgressSpinner,
    NgClass
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss'
})
export class ArticleListComponent implements OnInit {
  @Input() articles!: Article[];
  @Input() maxArticles: number = 5;
  @Input() maxArticlesPerRow: number = 2;

  constructor(private articleService: ArticleService) {
  }

  ngOnInit() {
    if (!this.articles?.length) {
      this.articleService.getAllArticles()
        .subscribe((articles: Article[]) => {
          this.articles = this.spliceArticles(articles);
        })
    }
  }

  trackByHeader(index: number, article: Article): string|undefined {
    return article.header;
  }

  private spliceArticles(articles: Article[]): Article[] {
    return articles.slice(0, Math.min(this.maxArticles, articles.length));
  }
}

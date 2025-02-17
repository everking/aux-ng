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
  subCategoryMap:Record<string, {articles: string[];}> = {} ;

  constructor(public articleService: ArticleService) {
  }

  ngOnChanges() {
    this.subCategoryMap = this.articleService.getSubCategoryMap(this.category);
    if (!this.subCategoryMap) {
      this.subCategoryMap = this.articleService.getCategoryMap(this.category);
    }

    /*
    this.articleService.getAllArticles()
      .subscribe((articles: Article[]) => {
        this.articles = this.spliceArticles(articles);
        if (this.category) {
          this.articles = this.articles.filter(item => item.meta?.category === this.category);
          this.subCategoryMap = this.articles.reduce((acc:Record<string, Article[]>, item) => {
            const subCategory = item.meta?.subCategory;
            if (subCategory) {
              if(!acc[subCategory]) {
                acc[subCategory] = [];
              }
              acc[subCategory].push(item);
            }

            return acc;
          }, {} as Record<string, Article[]>);
        }
      })*/
  }

  trackByHeader(index: number, article: Article): string|undefined {
    return article.header;
  }

  private spliceArticles(articles: Article[]): Article[] {
    return articles; // .slice(0, Math.min(this.maxArticles, articles.length));
  }
}

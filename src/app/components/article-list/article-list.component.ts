import { Component, Input, OnInit } from '@angular/core';
import { Article } from "../../interfaces/article";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { ArticlePreviewComponent } from "../article-preview/article-preview.component";
import { ArticleService } from "../../services/article.service";
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    NgForOf,
    ArticlePreviewComponent,
    NgIf,
    MatProgressSpinner,
    NgClass
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss'
})
export class ArticleListComponent implements OnInit {
  @Input() articles!: Article[];

  constructor(private articleService: ArticleService) {
  }

  ngOnInit() {
    if (!this.articles?.length) {
      this.articleService.getArticleList()
        .subscribe((articles: Article[]) => {
          this.articles = articles;
        })
    }
  }

  trackByHeader(index: number, article: Article): string|undefined {
    return article.header;
  }
}

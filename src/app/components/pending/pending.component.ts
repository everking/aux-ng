import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatGridListModule } from "@angular/material/grid-list";
import { ArticleService } from '../../services/article.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Article } from '../../interfaces/article';

@Component({
    selector: 'app-search',
    imports: [
        CommonModule,
        MatGridListModule,
        NgIf,
        FormsModule,
        RouterLink
    ],
    templateUrl: './pending.component.html',
    styleUrl: './pending.component.css'
})
export class PendingComponent {
  articles: Array<Article> | null | undefined = [];
  lastUpdated: string | null | undefined = null;
  constructor(private articleService: ArticleService, private router: Router) {    
  }

  async ngOnInit() {
    const pendingArticles = await this.articleService.fetchPendingArticles();
    this.articles = pendingArticles?.articles;
    this.lastUpdated = pendingArticles?.lastUpdated;
  }
}

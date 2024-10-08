import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JsonPipe, NgIf, UpperCasePipe } from "@angular/common";
import { take } from "rxjs";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Article } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [
    JsonPipe,
    UpperCasePipe,
    NgIf,
    MatProgressSpinner
  ],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss'
})
export class ArticleComponent implements OnInit {
  article!: Article;

  constructor(private route: ActivatedRoute, private articleService: ArticleService) {
  }

  ngOnInit() {
    const articleId: string | null = this.route.snapshot.paramMap.get('articleId');
    this.articleService.getSingleArticle(articleId).pipe(take(1)).subscribe((article: Article) => {
      this.article = article;
    });
  }
}

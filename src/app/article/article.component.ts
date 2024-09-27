import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from "../services/article.service";
import { Article } from "../interfaces/article";
import { JsonPipe, UpperCasePipe } from "@angular/common";

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [
    JsonPipe,
    UpperCasePipe
  ],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss'
})
export class ArticleComponent implements OnInit {
  articleId!: string;
  article!: Article;

  constructor(private route: ActivatedRoute, private articleService: ArticleService) {
  }

  ngOnInit() {
    const articleId: string | null = this.route.snapshot.paramMap.get('articleId');
    if (articleId) {
      this.articleId = articleId;
      this.articleService.readOne(articleId)
        .subscribe((article: Article) => {
          this.article = article;
        });
    }
  }
}

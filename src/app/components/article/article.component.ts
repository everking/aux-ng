import { Component, OnInit } from '@angular/core';
import { JsonPipe, NgIf, UpperCasePipe } from "@angular/common";
import { take } from "rxjs";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Article } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";
import { LoginService } from '../../services/login.service';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [
    JsonPipe,
    UpperCasePipe,
    NgIf,
    MatProgressSpinner,
    RouterModule
  ],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss'
})
export class ArticleComponent implements OnInit {
  article!: Article | null;
  isLoggedIn: boolean = false;
  editLink: string = '';

  constructor(
    private route: ActivatedRoute, 
    private loginService: LoginService, 
    private articleService: ArticleService) {
  }

  async ngOnInit() {
    this.isLoggedIn = this.loginService.isLoggedIn();
    const articleId: string = this.route.snapshot.paramMap.get('articleId') || '';
    this.editLink = `/edit-article/${articleId}`;
    this.article = await this.articleService.fetchLocalArticle(articleId);
  }
}

import { Component } from '@angular/core';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private articleService:ArticleService) {

  }
  ngOnInit() {
    this.articleService.setCurrentCategory("");
  }
}

import { Component } from '@angular/core';
import { MatGridList, MatGridTile } from "@angular/material/grid-list";
import { ArticleListComponent } from "../../components/article-list/article-list.component";
import { ArticlePreviewCardComponent } from "../../components/article-preview-card/article-preview-card.component";
import { ArticleService } from '../../services/article.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ArticlePreviewCardComponent,
    MatGridList,
    MatGridTile,
    ArticleListComponent
  ],
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

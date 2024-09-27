import { Component } from '@angular/core';
import { ArticlePreviewComponent } from "../../components/article-preview/article-preview.component";
import { MatGridList, MatGridTile } from "@angular/material/grid-list";
import { ArticleListComponent } from "../../components/article-list/article-list.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ArticlePreviewComponent,
    MatGridList,
    MatGridTile,
    ArticleListComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
}

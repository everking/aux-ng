import {Component} from '@angular/core';
import {ArticlePreviewComponent} from "../../components/article-preview/article-preview.component";
import {MatGridList, MatGridTile} from "@angular/material/grid-list";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ArticlePreviewComponent,
    MatGridList,
    MatGridTile
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
}

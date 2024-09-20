import {Component, Input} from '@angular/core';
import {MatCardModule} from "@angular/material/card";
import {SlicePipe, UpperCasePipe} from "@angular/common";
import {Article} from "../../interfaces/article";

@Component({
  selector: 'app-article-preview',
  standalone: true,
  imports: [
    MatCardModule,
    UpperCasePipe,
    SlicePipe,
  ],
  templateUrl: './article-preview.component.html',
  styleUrl: './article-preview.component.scss'
})
export class ArticlePreviewComponent {
  @Input() article!: Article;
}

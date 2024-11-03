import { Component } from '@angular/core';
import { ArticleListComponent } from "../../components/article-list/article-list.component";

@Component({
  selector: 'app-excellence',
  standalone: true,
  imports: [
    ArticleListComponent
  ],
  templateUrl: './excellence.component.html',
  styleUrl: './excellence.component.css'
})
export class ExcellenceComponent {

}

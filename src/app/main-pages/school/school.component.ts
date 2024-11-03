import { Component } from '@angular/core';
import { ArticleListComponent } from "../../components/article-list/article-list.component";

@Component({
  selector: 'app-school',
  standalone: true,
  imports: [
    ArticleListComponent
  ],
  templateUrl: './school.component.html',
  styleUrl: './school.component.css'
})
export class SchoolComponent {

}

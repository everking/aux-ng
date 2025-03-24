import { Component } from '@angular/core';
import { MatGridListModule } from "@angular/material/grid-list";
import { ArticleService } from '../../services/article.service';
@Component({
    selector: 'app-privacy',
    imports: [
        MatGridListModule
    ],
    templateUrl: './terms.component.html',
    styleUrl: './terms.component.css'
})
export class TermsComponent {
  lastUpdated = 'March 23, 2025';
  constructor(private articleService: ArticleService) {
  }
  ngOnInit() {
    this.articleService.setCurrentCategory("");
  }
}

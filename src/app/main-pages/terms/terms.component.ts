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
  lastUpdated = 'September 14, 2026';
  constructor(private articleService: ArticleService) {
  }
  ngOnInit() {
    this.articleService.setCurrentCategory("");
  }
}

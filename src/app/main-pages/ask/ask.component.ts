import { Component } from '@angular/core';
import { MatGridListModule } from "@angular/material/grid-list";
import { ArticleService } from '../../services/article.service';
@Component({
    selector: 'app-ask',
    imports: [
        MatGridListModule
    ],
    templateUrl: './ask.component.html',
    styleUrl: './ask.component.css'
})
export class AskComponent {
  constructor(private articleService: ArticleService) {
    
  }
  ngOnInit() {
    this.articleService.setCurrentCategory("");
  }
}

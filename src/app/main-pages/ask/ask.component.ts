import { Component } from '@angular/core';
import { MatGridListModule } from "@angular/material/grid-list";
import { ArticleService } from '../../services/article.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-ask',
    imports: [
        MatGridListModule,
        FormsModule,
    ],
    templateUrl: './ask.component.html',
    styleUrl: './ask.component.css'
})
export class AskComponent {
  placeholder = 'Need help? Try “I need activity ideas for my kids."';
  query = '';
  constructor(private articleService: ArticleService, private router: Router) {    
  }
  search() {
    this.router.navigate(['/search', this.query]);
  }

  ngOnInit() {
    this.articleService.setCurrentCategory("");
  }
}

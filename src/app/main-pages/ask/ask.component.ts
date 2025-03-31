import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatGridListModule } from "@angular/material/grid-list";
import { ArticleService } from '../../services/article.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-ask',
    imports: [
        CommonModule,
        MatGridListModule,
        NgIf,
        FormsModule,
    ],
    templateUrl: './ask.component.html',
    styleUrl: './ask.component.css'
})
export class AskComponent {
  placeholder = 'Need help? Try “I need activity ideas for my kids."';
  query = '';
  mruQueries: string[] = [];
  showDropdown = false;

  constructor(private articleService: ArticleService, private router: Router) {    
  }

  loadMRUQueries() {
    const cache = JSON.parse(localStorage.getItem('queryCache') || '{}');
    const sorted = Object.entries(cache)
      .sort((a: any, b: any) => b[1].lastUsed - a[1].lastUsed)
      .slice(0, 5)
      .map(entry => entry[0]);
    this.mruQueries = sorted;
  }  

  onFocus() {
    if (!this.query) {
      this.loadMRUQueries();
      this.showDropdown = true;
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200); // delay to allow click selection
  }

  onQueryChange(value: string) {
    if (!value.trim()) {
      this.loadMRUQueries();
      this.showDropdown = true;
    } else {
      this.showDropdown = false;
    }
  }

  search() {
    this.router.navigate(['/search'], {
      queryParams: { q: this.query.trim() }
    });
  }

  ngOnInit() {
    this.articleService.setCurrentCategory("");
  }
}

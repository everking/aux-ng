import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';

import { ArticleListComponent } from "../../components/article-list/article-list.component";
import { Subscription } from 'rxjs';
import { ArticleService, Category } from '../../services/article.service';
@Component({
    selector: 'app-family',
    imports: [
        ArticleListComponent, NgIf
    ],
    templateUrl: './article-category.component.html',
    styleUrl: './article-category.component.css'
})
export class ArticleCategoryComponent {
  public pageId: string = '';
  private routeSub!: Subscription;
  public category: Category | undefined;
  
  constructor (private route: ActivatedRoute, private articleService: ArticleService) {
  }

  async ngOnInit() {
    await this.articleService.loadCategories();    
    this.routeSub = this.route.paramMap.subscribe(paramMap => {
      this.pageId = paramMap.get('pageId')!;
      if (this.pageId == "school") {
        this.pageId = "high-school";
      }
      this.articleService.setCurrentCategory(this.pageId);
      this.category = this.articleService.getCurrentCategory();
    });
  }
}

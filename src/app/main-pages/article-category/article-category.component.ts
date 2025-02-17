import { Component } from '@angular/core';
import { ArticleListComponent } from "../../components/article-list/article-list.component";
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArticleService } from '../../services/article.service';
@Component({
    selector: 'app-family',
    imports: [
        ArticleListComponent
    ],
    templateUrl: './article-category.component.html',
    styleUrl: './article-category.component.css'
})
export class ArticleCategoryComponent {
  public pageId: string = '';
  private routeSub!: Subscription;
  
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
    });
  }
}

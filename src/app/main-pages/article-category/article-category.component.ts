import { Component } from '@angular/core';
import { ArticleListComponent } from "../../components/article-list/article-list.component";
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [
    ArticleListComponent
  ],
  templateUrl: './article-category.component.html',
  styleUrl: './article-category.component.css'
})
export class ArticleCategoryComponent {
  public pageId: string = '';
  private routeSub!: Subscription;
  
  constructor (private route: ActivatedRoute) {

  }
  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(paramMap => {
      this.pageId = paramMap.get('pageId')!;
      if (this.pageId == "school") {
        this.pageId = "high-school";
      }
    });
  }
}

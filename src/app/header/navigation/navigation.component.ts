import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButton } from "@angular/material/button";
import { ArticleService } from '../../services/article.service';
@Component({
    selector: 'app-navigation', // This makes the component standalone
    imports: [CommonModule, RouterModule, MatButton],
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent { 
  constructor (private articleService: ArticleService, private router: Router) {

  }
  public isCategoryActive(category:string): boolean {
    return (this.articleService.getCurrentCategory()?.key == category);
  }

  public isEventsActive(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/events' || url.startsWith('/event/') || url.startsWith('/edit-event/');
  }
}

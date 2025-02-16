import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButton } from "@angular/material/button";
import { ArticleService } from '../../services/article.service';
@Component({
  selector: 'app-navigation',
  standalone: true,  // This makes the component standalone
  imports: [CommonModule, RouterModule, MatButton],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent { 
  constructor (private articleService: ArticleService) {

  }
  public isCategoryActive(category:string): boolean {
    return (this.articleService.getCurrentCategory() == category);
  }
}

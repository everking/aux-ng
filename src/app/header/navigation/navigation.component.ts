import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatButton } from "@angular/material/button";
import { filter } from 'rxjs';
import { ArticleService } from '../../services/article.service';
@Component({
    selector: 'app-navigation', // This makes the component standalone
    imports: [CommonModule, RouterModule, MatButton],
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  menuOpen = false;

  constructor (private articleService: ArticleService, private router: Router) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.menuOpen = false;
    });
  }

  public isCategoryActive(category:string): boolean {
    return (this.articleService.getCurrentCategory()?.key == category);
  }

  public isEventsActive(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/events' || url.startsWith('/event/') || url.startsWith('/edit-event/');
  }

  public toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  public closeMenu() {
    this.menuOpen = false;
  }
}

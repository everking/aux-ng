import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { BrowseListService } from '../../services/browse-list.service';

@Component({
  selector: 'app-back-link',
  templateUrl: './back-link.component.html',
  styleUrl: './back-link.component.scss'
})
export class BackLinkComponent {
  @Input() fallback = '/home';

  constructor(
    private location: Location,
    private router: Router,
    private browse: BrowseListService
  ) {}

  goBack(): void {
    const parentUrl = this.browse.parentUrl();
    if (parentUrl) {
      void this.router.navigateByUrl(parentUrl);
      return;
    }
    const state = this.location.getState() as { navigationId?: number };
    if ((state?.navigationId ?? 0) > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl(this.fallback);
  }
}

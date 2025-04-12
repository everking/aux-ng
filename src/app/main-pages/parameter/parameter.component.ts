import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router, Routes, Route, ROUTES } from '@angular/router';

@Component({
    selector: 'app-parameter',
    imports: [],
    templateUrl: './parameter.component.html',
    styleUrl: './parameter.component.scss'
})
export class ParameterComponent implements OnInit {
  refParam: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, @Inject(ROUTES) private routes: Routes[]) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.refParam = params.get('ref');

      // If no 'ref' query parameter is present, redirect to /home
      if (!this.refParam) {
        this.router.navigate(['/home']);
      } else {

        const decodedPath = decodeURIComponent(this.refParam);
        const normalizedPath = decodedPath.replace(/^\/+/, ''); // remove leading slash
      
        const allRoutes = this.routes.flatMap(r => r);  // flatten the array of route arrays
      
        const isValidRoute = allRoutes.some((route: Route) => {
          return route.path === normalizedPath;
        });

        if (isValidRoute) {
          this.router.navigateByUrl(decodedPath);
        } else {
          console.warn('Invalid route:', decodedPath);
          // Optionally redirect to 404 or fallback
          this.router.navigateByUrl('/resources');
        }

      }
    });
  }
}

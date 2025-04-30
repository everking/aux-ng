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
        console.log('Redirect to home');
        this.router.navigate(['/home']);
      } else {
        console.log('Redirect to:', this.refParam);
        this.router.navigate([this.refParam]);        
      }
    });
  }
}

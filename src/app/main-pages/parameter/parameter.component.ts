import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-parameter',
    imports: [],
    templateUrl: './parameter.component.html',
    styleUrl: './parameter.component.scss'
})
export class ParameterComponent implements OnInit {
  refParam: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.refParam = params.get('ref');

      // If no 'ref' query parameter is present, redirect to /home
      if (!this.refParam) {
        this.router.navigate(['/home']);
      } else {
        const decodedPath = decodeURIComponent(this.refParam);
        this.router.navigateByUrl(decodedPath);
      }
    });
  }
}

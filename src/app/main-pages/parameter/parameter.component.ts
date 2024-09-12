import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import e from 'cors';

@Component({
  selector: 'app-parameter',
  standalone: true,
  imports: [],
  templateUrl: './parameter.component.html',
  styleUrl: './parameter.component.scss'
})
export class ParameterComponent {
  refParam: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.refParam = params.get('ref');

      // If no 'ref' query parameter is present, redirect to /home
      if (!this.refParam) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate([this.refParam]);
      }
    });
  }
}

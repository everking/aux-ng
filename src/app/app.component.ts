import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FooterComponent } from "./footer/footer.component";
import { NavigationComponent } from "./header/navigation/navigation.component";

@Component({
  selector: 'app-root',
  standalone: true,  // Standalone component
  imports: [NavigationComponent, RouterModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'Auxilium';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
//    this.router.navigate(['/home'], { relativeTo: this.route });
    this.route.queryParams.subscribe(params => {
      console.log(`params: ${JSON.stringify(params, null, 2)}`);
      const refUrl = params['ref'];  // Get the 'ref' query param

      console.log(`refUrl: ${refUrl}`);

      if (refUrl) {
        // Use the URL object to extract the path from the ref parameter
        const url = new URL(refUrl);
        const routePath = url.pathname; // Extracts the path like '/home'

        console.log(`Extracted route path: ${routePath}`);

        // Route to the extracted path if valid (assuming the route exists in your app)
        this.router.navigate([routePath]);
      }
    });
  }
}

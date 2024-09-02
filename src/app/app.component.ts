import { Component } from '@angular/core';
import { NavigationComponent } from './navigation/navigation.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,  // Standalone component
  imports: [NavigationComponent, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'my-angular-app';
}
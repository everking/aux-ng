import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {FooterComponent} from "./footer/footer.component";
import {NavigationComponent} from "./header/navigation/navigation.component";

@Component({
  selector: 'app-root',
  standalone: true,  // Standalone component
  imports: [NavigationComponent, RouterModule, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'my-angular-app';
}

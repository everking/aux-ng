import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FooterComponent} from "./footer/footer.component";
import {NavigationComponent} from "./header/navigation/navigation.component";

@Component({
  selector: 'app-root',
  standalone: true,  // Standalone component
  imports: [NavigationComponent, RouterModule, FooterComponent, FormsModule, AngularEditorModule],
  providers: [ ArticleService ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'Auxilium';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {

  }
}

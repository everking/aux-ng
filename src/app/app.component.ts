import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FooterComponent } from "./footer/footer.component";
import { NavigationComponent } from "./header/navigation/navigation.component";
import { ArticleService } from './services/article.service';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { LoginService } from './services/login.service';
import { PushService } from './services/push.service';
@Component({
    selector: 'app-root', // Standalone component
    imports: [NavigationComponent,
        RouterModule,
        FooterComponent,
        FormsModule,
        AngularEditorModule
    ],
    providers: [ArticleService],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit  {
  title = 'Auxilium';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private loginService: LoginService,
    private pushService: PushService
  ) {}
  ngOnInit(): void {
      this.loginService.refresh();
      this.pushService.listenForPermissionChanges();
      this.pushService.enroll({ prompt: true });
  }
}

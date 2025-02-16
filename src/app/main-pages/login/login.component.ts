import { combineLatest } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoginService, FireBaseLoginResponse } from '../../services/login.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  redirectUrl: string = '/home';
  loginMessage: string = '';
  actionLabel: string = 'Login';
  isSignup:boolean = false;
  email: string = '';
  password: string = '';
  messageClass: string = 'normal-message';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  constructor(
    private loginService: LoginService, 
    private route: ActivatedRoute, 
    private router: Router,
    private articleService: ArticleService
  ) {}
  
  checkLogin() {
    if (this.loginService.getIdToken()) {
      console.log("Already logged in.");
      this.router.navigate([this.redirectUrl]);
    }
  }
  
  ngOnInit(): void {
    this.articleService.setCurrentCategory("");
    const url$ = this.route.url;
    const queryParams$ = this.route.queryParams;
  
    combineLatest([url$, queryParams$]).subscribe(([urlSegment, params]) => {
      // Set `this.isSignup` based on the route path
      const currentRoute = urlSegment[0]?.path;
      this.isSignup = currentRoute === 'signup';
  
      // Set `this.redirectUrl` based on the query parameters
      this.redirectUrl = params['redirect'] || '/home';
  
      // Call `checkLogin` now that both are set
      this.checkLogin();
    });
  }

  getFormData() {
    this.email = this.loginForm.get('email')?.value || '';
    this.password = this.loginForm.get('password')?.value || '';
  }

  async onSubmit() {
    this.getFormData();
    if (!this.isSignup) {
      this.onLogin();
    } else {
      const response: FireBaseLoginResponse = await this.loginService.signUp(this.email, this.password);
      const response2: FireBaseLoginResponse = await this.loginService.sendEmailVerification(response.idToken);
    }
  }

  async onLogin() {    
    if (this.password) {
      const maskedPassword = this.password.length > 4 
        ? '*'.repeat(this.password.length - 4) + this.password.slice(-4) 
        : this.password;

      const response: FireBaseLoginResponse = await this.loginService.login(this.email, this.password);
      if (this.loginService.getIdToken()) {
        const loginInfo = {
          idToken: this.loginService.getIdToken()
        };
        this.loginMessage = 'Login successful.';
        this.messageClass = "error-message";
        this.router.navigate([this.redirectUrl]);
      } else {
        this.loginMessage = 'Login failed.';
        this.messageClass = "error-message";
        console.log('Login failed.');
      }
    }
  }
}
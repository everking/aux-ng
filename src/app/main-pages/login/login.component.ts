import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoginService, FireBaseLoginResponse } from '../../services/login.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

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

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  constructor(
    private loginService: LoginService, 
    private route: ActivatedRoute, 
    private router: Router) {

  }
  
  ngOnInit(): void {
    this.route.url.subscribe((urlSegment) => {
      const currentRoute = urlSegment[0]?.path;
      if (currentRoute === 'signup') {
        this.isSignup = true;
      } else {
        this.isSignup = false;
      }
    });
    // Get the 'redirect' query parameter
    this.route.queryParams.subscribe(params => {
      this.redirectUrl = params['redirect'] || '/home';
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
      if (this.loginService.idToken) {
        this.router.navigate([this.redirectUrl]);        
      } else {
        this.loginMessage = 'Login failed.';
        console.log('Login failed.');
      }
    }
  }
}
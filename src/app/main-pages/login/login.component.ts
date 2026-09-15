import { combineLatest, Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoginService, FireBaseLoginResponse } from '../../services/login.service';
import { PushService } from '../../services/push.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.service';

@Component({
    selector: 'app-login',
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

export class LoginComponent implements OnInit, OnDestroy {
  redirectUrl: string = '/home';
  loginMessage: string = '';
  actionLabel: string = 'Login';
  isSignup:boolean = false;
  email: string = '';
  password: string = '';
  messageClass: string = 'normal-message';
  confirmingDelete = false;
  needsReauth = false;
  pushEnabled = false;
  pushBusy = false;
  pushMessage = '';
  private pushSub?: Subscription;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  constructor(
    private loginService: LoginService, 
    private route: ActivatedRoute, 
    private router: Router,
    private articleService: ArticleService,
    private pushService: PushService
  ) {}
  
  get isLoggedIn(): boolean {
    return this.loginService.isLoggedIn();
  }

  get accountEmail(): string {
    return this.loginService.getEmail();
  }

  ngOnInit(): void {
    this.articleService.setCurrentCategory("");
    this.pushSub = this.pushService.enabled$.subscribe((enabled) => {
      this.pushEnabled = enabled;
    });
    void this.pushService.enroll({ prompt: false });
    const url$ = this.route.url;
    const queryParams$ = this.route.queryParams;
  
    combineLatest([url$, queryParams$]).subscribe(([urlSegment, params]) => {
      const currentRoute = urlSegment[0]?.path;
      this.isSignup = currentRoute === 'signup';
      this.redirectUrl = params['redirect'] || '/home';
    });
  }

  ngOnDestroy(): void {
    this.pushSub?.unsubscribe();
  }

  get isNativePush(): boolean {
    return this.pushService.isNative();
  }

  get canEnablePush(): boolean {
    return this.isNativePush && !this.pushEnabled;
  }

  async onEnablePush(): Promise<void> {
    if (!this.canEnablePush || this.pushBusy) {
      return;
    }
    this.pushBusy = true;
    this.pushMessage = '';
    const ok = await this.pushService.enroll({ prompt: true });
    this.pushBusy = false;
    if (ok) {
      this.pushMessage = 'You are signed up for notifications.';
      this.messageClass = 'normal-message';
      return;
    }
    this.pushMessage = this.pushService.isNative()
      ? 'Notifications are still off. If you declined earlier, enable them in iOS Settings → Auxilium, then return here.'
      : 'Notifications are available in the Auxilium iPhone app.';
    this.messageClass = 'error-message';
  }

  onLogout(): void {
    this.loginService.logout();
    this.confirmingDelete = false;
    this.needsReauth = false;
    this.loginMessage = 'You have been logged out.';
    this.messageClass = 'normal-message';
  }

  startDelete(): void {
    this.confirmingDelete = true;
    this.needsReauth = false;
    this.email = this.accountEmail;
    this.loginMessage = '';
  }

  cancelDelete(): void {
    this.confirmingDelete = false;
    this.needsReauth = false;
  }

  async onDeleteAccount(): Promise<void> {
    this.loginMessage = '';
    try {
      if (this.needsReauth) {
        this.getFormData();
        const email = this.accountEmail || this.email;
        await this.loginService.login(email, this.password);
        if (!this.loginService.isLoggedIn()) {
          this.loginMessage = 'Password is incorrect.';
          this.messageClass = 'error-message';
          return;
        }
      }
      await this.loginService.deleteAccount();
      this.confirmingDelete = false;
      this.needsReauth = false;
      this.loginMessage = 'Your account has been deleted.';
      this.messageClass = 'normal-message';
    } catch (error: unknown) {
      const code = error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: string }).code)
        : String(error);
      if (code.includes('CREDENTIAL_TOO_OLD_LOGIN_AGAIN')) {
        this.needsReauth = true;
        this.loginMessage = 'Enter your password to delete your account.';
        this.messageClass = 'error-message';
        return;
      }
      this.loginMessage = 'Could not delete account.';
      this.messageClass = 'error-message';
    }
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject } from 'rxjs';
import { LoginComponent } from './login.component';
import { LoginService } from '../../services/login.service';
import { PushService } from '../../services/push.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginService: jasmine.SpyObj<LoginService>;
  let pushEnabled$: BehaviorSubject<boolean>;
  let pushService: jasmine.SpyObj<PushService>;

  beforeEach(async () => {
    pushEnabled$ = new BehaviorSubject(false);
    pushService = jasmine.createSpyObj('PushService', ['isNative', 'enroll']);
    (pushService as { enabled$: BehaviorSubject<boolean> }).enabled$ = pushEnabled$;
    pushService.isNative.and.returnValue(true);
    pushService.enroll.and.resolveTo(false);

    loginService = jasmine.createSpyObj('LoginService', [
      'isLoggedIn',
      'getEmail',
      'getIdToken',
      'logout',
      'deleteAccount',
      'login',
      'signUp',
      'sendEmailVerification'
    ]);
    loginService.isLoggedIn.and.returnValue(false);
    loginService.getEmail.and.returnValue('');
    loginService.getIdToken.and.returnValue('');

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: LoginService, useValue: loginService },
        { provide: PushService, useValue: pushService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows account actions when logged in', () => {
    loginService.isLoggedIn.and.returnValue(true);
    loginService.getEmail.and.returnValue('member@example.com');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Signed in as member@example.com');
    expect(text).toContain('Log out');
    expect(text).toContain('Delete account');
    expect(text).toContain('Sign up for notifications');
  });

  it('hides the notification signup when already joined', () => {
    loginService.isLoggedIn.and.returnValue(true);
    loginService.getEmail.and.returnValue('member@example.com');
    pushEnabled$.next(true);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('You are signed up for notifications.');
    expect(text).not.toContain('Sign up for notifications');
  });

  it('logs out from the account screen', () => {
    loginService.isLoggedIn.and.returnValue(true);
    loginService.getEmail.and.returnValue('member@example.com');
    fixture.detectChanges();

    component.onLogout();
    expect(loginService.logout).toHaveBeenCalled();
    expect(component.loginMessage).toBe('You have been logged out.');
  });
});

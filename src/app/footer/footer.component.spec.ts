import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';
import { LoginService } from '../services/login.service';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let loginService: jasmine.SpyObj<LoginService>;

  beforeEach(async () => {
    loginService = jasmine.createSpyObj('LoginService', ['isLoggedIn']);
    loginService.isLoggedIn.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideRouter([]),
        { provide: LoginService, useValue: loginService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links to Login when logged out and Account when logged in', () => {
    expect(fixture.nativeElement.textContent).toContain('Login');
    loginService.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Account');
    expect(fixture.nativeElement.textContent).not.toContain('Login');
  });
});

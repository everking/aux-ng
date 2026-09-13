import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([]), provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles the mobile menu', () => {
    expect(component.menuOpen).toBeFalse();
    component.toggleMenu();
    expect(component.menuOpen).toBeTrue();
    component.closeMenu();
    expect(component.menuOpen).toBeFalse();
  });

  it('places Events between Home and Family', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.navigation-header-links button')
    ) as HTMLButtonElement[];
    const labels = buttons.map((button) => button.textContent?.trim());
    const homeIndex = labels.indexOf('Home');
    const eventsIndex = labels.indexOf('Events');
    const familyIndex = labels.indexOf('Family');
    expect(eventsIndex).toBe(homeIndex + 1);
    expect(familyIndex).toBe(eventsIndex + 1);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter, Router } from '@angular/router';
import { BackLinkComponent } from './back-link.component';
import { BrowseListService } from '../../services/browse-list.service';

describe('BackLinkComponent', () => {
  let component: BackLinkComponent;
  let fixture: ComponentFixture<BackLinkComponent>;
  let location: Location;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BackLinkComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(BackLinkComponent);
    component = fixture.componentInstance;
    location = TestBed.inject(Location);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returns to the remembered parent list', () => {
    const browse = TestBed.inject(BrowseListService);
    browse.remember('event', ['a', 'b'], '/events');
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    spyOn(location, 'back');
    component.goBack();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/events');
    expect(location.back).not.toHaveBeenCalled();
  });

  it('goes back when there is in-app history', () => {
    spyOn(location, 'getState').and.returnValue({ navigationId: 2 });
    spyOn(location, 'back');
    component.goBack();
    expect(location.back).toHaveBeenCalled();
  });

  it('uses the fallback when there is no in-app history', () => {
    spyOn(location, 'getState').and.returnValue({ navigationId: 1 });
    spyOn(location, 'back');
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    component.fallback = '/events';
    component.goBack();
    expect(location.back).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/events');
  });
});

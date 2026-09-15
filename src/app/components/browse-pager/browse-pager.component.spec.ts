import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowsePagerComponent } from './browse-pager.component';
import { BrowseListService } from '../../services/browse-list.service';

describe('BrowsePagerComponent', () => {
  let component: BrowsePagerComponent;
  let fixture: ComponentFixture<BrowsePagerComponent>;
  let browse: BrowseListService;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BrowsePagerComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    browse = TestBed.inject(BrowseListService);
    browse.remember('event', ['one', 'two', 'three'], '/events');
    fixture = TestBed.createComponent(BrowsePagerComponent);
    component = fixture.componentInstance;
    component.currentId = 'two';
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('shows previous and next for a middle item', () => {
    expect(component.visible).toBeTrue();
    expect(component.prevItem?.id).toBe('one');
    expect(component.nextItem?.id).toBe('three');
  });
});

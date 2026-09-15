import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BrowseListService } from './browse-list.service';

describe('BrowseListService', () => {
  let service: BrowseListService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
    service = TestBed.inject(BrowseListService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('returns previous and next items from the remembered list', () => {
    service.remember('event', ['a', 'b', 'c'], '/events');
    expect(service.parentUrl()).toBe('/events');
    expect(service.neighbors('b')).toEqual({
      prev: { id: 'a', kind: 'event' },
      next: { id: 'c', kind: 'event' }
    });
    expect(service.neighbors('a').prev).toBeUndefined();
    expect(service.neighbors('c').next).toBeUndefined();
  });

  it('navigates to a neighbor with replaceUrl', () => {
    spyOn(router, 'navigate').and.resolveTo(true);
    service.remember('article', ['one', 'two'], '/family');
    expect(service.goNeighbor('one', 1)).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/article', 'two'], { replaceUrl: true });
  });
});

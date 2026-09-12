import { TestBed } from '@angular/core/testing';
import { DEFAULT_TAGS, TagCatalogService } from './tag-catalog.service';

describe('TagCatalogService', () => {
  let service: TagCatalogService;

  beforeEach(() => {
    localStorage.removeItem('auxilium.extraTags');
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagCatalogService);
  });

  it('starts with the default catalog', () => {
    expect(service.getAvailable()).toEqual(DEFAULT_TAGS);
  });

  it('remembers a new other tag', () => {
    service.remember(' vigil ');
    expect(service.getAvailable()).toContain('vigil');
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReadingsService } from './readings.service';

describe('ReadingsService', () => {
  let service: ReadingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ReadingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('builds the dated readings URL', () => {
    const url = service.readingsUrl(new Date(2026, 8, 14, 18, 0, 0));
    expect(url).toBe('https://cpbjr.github.io/catholic-readings-api/readings/2026/09-14.json');
  });

  it('reads gospel and usccbLink from the API payload', async () => {
    const pending = service.getTodaysGospel(new Date(2026, 8, 14, 18, 0, 0));
    const req = http.expectOne('https://cpbjr.github.io/catholic-readings-api/readings/2026/09-14.json');
    req.flush({
      readings: { gospel: 'John 3:13-17' },
      usccbLink: 'https://bible.usccb.org/bible/readings/091426.cfm'
    });
    await expectAsync(pending).toBeResolvedTo({
      gospel: 'John 3:13-17',
      usccbLink: 'https://bible.usccb.org/bible/readings/091426.cfm'
    });
  });
});

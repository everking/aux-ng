import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { HomeComponent } from './home.component';
import { EventService } from '../../services/event.service';
import { ReadingsService } from '../../services/readings.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: EventService,
          useValue: {
            fetchEvents: () => Promise.resolve([])
          }
        },
        {
          provide: ReadingsService,
          useValue: {
            getTodaysGospel: () => Promise.resolve({
              gospel: 'John 3:13-17',
              usccbLink: 'https://bible.usccb.org/bible/readings/091426.cfm'
            })
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

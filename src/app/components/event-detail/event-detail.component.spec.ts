import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { EventDetailComponent } from './event-detail.component';
import { PushService } from '../../services/push.service';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let pushEnabled$: BehaviorSubject<boolean>;
  let pushService: jasmine.SpyObj<PushService> & { enabled$: BehaviorSubject<boolean> };

  beforeEach(async () => {
    pushEnabled$ = new BehaviorSubject(false);
    pushService = jasmine.createSpyObj('PushService', [
      'isNative',
      'hasReminder',
      'enroll',
      'setReminder'
    ]);
    (pushService as { enabled$: BehaviorSubject<boolean> }).enabled$ = pushEnabled$;
    pushService.isNative.and.returnValue(false);
    pushService.hasReminder.and.returnValue(false);
    pushService.enroll.and.resolveTo(false);
    pushService.setReminder.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PushService, useValue: pushService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables Remind me when push is not enabled', () => {
    component.status = 'upcoming';
    component.pushEnabled = false;
    expect(component.canRemind).toBeFalse();
    expect(component.remindLabel).toBe('Remind me');
    expect(component.remindHint).toContain('iPhone app');
  });

  it('enables Remind me after push is granted', () => {
    component.status = 'upcoming';
    pushEnabled$.next(true);
    expect(component.canRemind).toBeTrue();
  });
});

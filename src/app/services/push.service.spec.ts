import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { PushService } from './push.service';

describe('PushService', () => {
  let service: PushService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PushService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('treats the web app as push-disabled', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
    const enabled = await service.enroll({ prompt: true });
    expect(enabled).toBeFalse();
    expect(service.isEnabled()).toBeFalse();
    expect(service.isNative()).toBeFalse();
  });

  it('does not set a reminder without a push token', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
    const ok = await service.setReminder({
      eventId: 'evt-1',
      header: 'CAL Forum',
      dateFrom: '2026-09-19',
      dateTo: '2026-09-19',
      where: 'Berkeley',
      body: '',
      dates: '',
      schedule: '',
      recurrence: null,
      tags: [],
      imageURI: '',
      meta: {}
    }, true);
    expect(ok).toBeFalse();
    expect(service.hasReminder('evt-1')).toBeFalse();
  });
});

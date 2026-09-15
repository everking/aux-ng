import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { BulletinEvent } from '../interfaces/bulletin-event';

const REGISTER_URL = 'https://us-central1-auxilium-420904.cloudfunctions.net/registerPushToken';
const REMINDER_URL = 'https://us-central1-auxilium-420904.cloudfunctions.net/registerEventReminder';
const REMINDER_IDS_KEY = 'auxilium.eventReminders';

@Injectable({
  providedIn: 'root'
})
export class PushService {
  readonly enabled$ = new BehaviorSubject<boolean>(false);
  private token: string | null = null;
  private listening = false;

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  isEnabled(): boolean {
    return this.enabled$.value;
  }

  hasReminder(eventId: string): boolean {
    return this.reminderIds().includes(eventId);
  }

  listenForPermissionChanges(): void {
    if (this.listening || typeof document === 'undefined') {
      return;
    }
    this.listening = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.enroll({ prompt: false });
      }
    });
    window.addEventListener('focus', () => {
      void this.enroll({ prompt: false });
    });
  }

  async enroll(options: { prompt?: boolean } = {}): Promise<boolean> {
    const prompt = options.prompt !== false;
    if (!this.isNative()) {
      this.enabled$.next(false);
      this.token = null;
      return false;
    }

    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
      let permission = await FirebaseMessaging.checkPermissions();
      if (permission.receive !== 'granted' && prompt) {
        permission = await FirebaseMessaging.requestPermissions();
      }
      if (permission.receive !== 'granted') {
        this.token = null;
        this.enabled$.next(false);
        return false;
      }

      const { token } = await FirebaseMessaging.getToken();
      if (!token) {
        this.token = null;
        this.enabled$.next(false);
        return false;
      }

      this.token = token;
      this.enabled$.next(true);
      await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          platform: Capacitor.getPlatform()
        })
      });
      return true;
    } catch (error) {
      console.error('Push enrollment failed', error);
      this.token = null;
      this.enabled$.next(false);
      return false;
    }
  }

  async setReminder(event: BulletinEvent, enabled: boolean): Promise<boolean> {
    await this.enroll({ prompt: false });
    if (!this.token || !this.isEnabled()) {
      return false;
    }

    const response = await fetch(REMINDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.token,
        eventId: event.eventId,
        header: event.header,
        dateFrom: event.dateFrom,
        dateTo: event.dateTo || event.dateFrom,
        where: event.where || '',
        enabled
      })
    });
    if (!response.ok) {
      return false;
    }
    this.storeReminder(event.eventId, enabled);
    return true;
  }

  private reminderIds(): string[] {
    try {
      const raw = localStorage.getItem(REMINDER_IDS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  private storeReminder(eventId: string, enabled: boolean): void {
    const ids = new Set(this.reminderIds());
    if (enabled) {
      ids.add(eventId);
    } else {
      ids.delete(eventId);
    }
    localStorage.setItem(REMINDER_IDS_KEY, JSON.stringify([...ids]));
  }
}

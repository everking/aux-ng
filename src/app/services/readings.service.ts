import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const READINGS_BASE = 'https://cpbjr.github.io/catholic-readings-api/readings';

export interface DailyGospel {
  gospel: string;
  usccbLink: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReadingsService {
  constructor(private http: HttpClient) {}

  dateParts(now = new Date()): { year: string; month: string; day: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    return {
      year: parts.find((part) => part.type === 'year')?.value || '',
      month: parts.find((part) => part.type === 'month')?.value || '',
      day: parts.find((part) => part.type === 'day')?.value || ''
    };
  }

  readingsUrl(now = new Date()): string {
    const { year, month, day } = this.dateParts(now);
    return `${READINGS_BASE}/${year}/${month}-${day}.json`;
  }

  fallbackUsccbLink(now = new Date()): string {
    const { year, month, day } = this.dateParts(now);
    return `https://bible.usccb.org/bible/readings/${month}${day}${year.slice(-2)}.cfm`;
  }

  async getTodaysGospel(now = new Date()): Promise<DailyGospel> {
    const fallback = {
      gospel: "today's Gospel",
      usccbLink: this.fallbackUsccbLink(now)
    };
    try {
      const data = await firstValueFrom(this.http.get<any>(this.readingsUrl(now)));
      const gospel = data?.readings?.gospel || data?.reading?.gospel;
      const usccbLink = data?.usccbLink;
      if (!gospel || !usccbLink) {
        return fallback;
      }
      return { gospel: String(gospel), usccbLink: String(usccbLink) };
    } catch (error) {
      console.error('Failed to load daily readings', error);
      return fallback;
    }
  }
}

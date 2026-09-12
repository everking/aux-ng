import { Injectable } from '@angular/core';
import { normalizeTags } from '../utils';

export const DEFAULT_TAGS = [
  'men',
  'women',
  'boys',
  'girls',
  'recollection',
  'retreat',
  'fun activities',
  'holiday',
  'celebration',
  'camp'
];

const EXTRA_TAGS_KEY = 'auxilium.extraTags';

@Injectable({
  providedIn: 'root'
})
export class TagCatalogService {
  getAvailable(): string[] {
    return normalizeTags([...DEFAULT_TAGS, ...this.readExtras()]);
  }

  remember(tag: string) {
    const normalized = tag.trim();
    if (!normalized) {
      return;
    }
    const available = this.getAvailable();
    const exists = available.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return;
    }
    const extras = normalizeTags([...this.readExtras(), normalized]);
    localStorage.setItem(EXTRA_TAGS_KEY, JSON.stringify(extras));
  }

  private readExtras(): string[] {
    try {
      const raw = localStorage.getItem(EXTRA_TAGS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? normalizeTags(parsed) : [];
    } catch {
      return [];
    }
  }
}

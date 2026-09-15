import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export type BrowseKind = 'event' | 'article';

export interface BrowseItem {
  id: string;
  kind: BrowseKind;
}

interface BrowseList {
  items: BrowseItem[];
  parentUrl: string;
}

const STORAGE_KEY = 'auxilium.browseList';

@Injectable({
  providedIn: 'root'
})
export class BrowseListService {
  private list: BrowseList | null = null;

  constructor(private router: Router) {
    this.restore();
  }

  set(items: BrowseItem[], parentUrl: string): void {
    const cleaned = items.filter((item) => item.id);
    this.list = { items: cleaned, parentUrl };
    this.persist();
  }

  remember(kind: BrowseKind, ids: string[], parentUrl: string): void {
    this.set(ids.map((id) => ({ id, kind })), parentUrl);
  }

  parentUrl(): string | null {
    return this.list?.parentUrl || null;
  }

  neighbors(id: string): { prev?: BrowseItem; next?: BrowseItem } {
    const items = this.list?.items || [];
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      return {};
    }
    return {
      prev: items[index - 1],
      next: items[index + 1]
    };
  }

  private inflight = false;

  go(item: BrowseItem): void {
    const commands = item.kind === 'event' ? ['/event', item.id] : ['/article', item.id];
    void this.router.navigate(commands, { replaceUrl: true });
  }

  goNeighbor(id: string, direction: -1 | 1): boolean {
    if (this.inflight) {
      return false;
    }
    const { prev, next } = this.neighbors(id);
    const target = direction < 0 ? prev : next;
    if (!target) {
      return false;
    }
    this.inflight = true;
    this.go(target);
    return true;
  }

  doneNavigating(): void {
    this.inflight = false;
  }

  private persist(): void {
    try {
      if (this.list) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.list));
      }
    } catch {
      /* ignore quota / private mode */
    }
  }

  private restore(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as BrowseList;
      if (parsed?.items && Array.isArray(parsed.items) && parsed.parentUrl) {
        this.list = parsed;
      }
    } catch {
      this.list = null;
    }
  }
}

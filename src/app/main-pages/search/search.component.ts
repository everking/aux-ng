import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ArticleService } from '../../services/article.service';
import { BrowseListService } from '../../services/browse-list.service';
import { Article, ArticleState } from '../../interfaces/article';
import { EventService } from '../../services/event.service';
import { BulletinEvent } from '../../interfaces/bulletin-event';
import { stripHtml as htmlToText } from '../../utils';

const ACTIVE_URL = 'assets/index/active.json';
const LEGACY_INDEX_URL = 'assets/index/article-embeddings.json';
const EMBEDDING_ENDPOINT = 'https://us-central1-auxilium-420904.cloudfunctions.net/generateEmbedding';
const RESULT_LIMIT = 10;

export interface SearchHit {
  id: string;
  score: number;
  kind: 'article' | 'event';
  article?: Article | null;
  event?: BulletinEvent | null;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatGridListModule,
    MatProgressSpinner,
    RouterLink
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  searching = false;
  searchError = '';
  query = '';
  placeholder = 'Need help? Try “I need activity ideas for my kids."';
  index: { id: string; embedding: number[] }[] = [];
  indexProvider = '';
  results: SearchHit[] = [];
  mruQueries: string[] = [];
  showDropdown = false;

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private articleService: ArticleService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router,
    private browse: BrowseListService
  ) {}

  getPlaceholder() {
    return this.placeholder;
  }

  getIndexAndSearch() {
    this.searching = true;
    this.searchError = '';
    if (this.index.length > 0) {
      if (this.query) {
        void this.performSearch();
      } else {
        this.searching = false;
      }
      return;
    }
    this.loadEmbeddingIndex().then(() => {
      if (this.query) {
        void this.performSearch();
      } else {
        this.searching = false;
      }
    }).catch((error) => {
      console.error('Failed to load embedding index', error);
      this.searchError = 'Search is temporarily unavailable.';
      this.searching = false;
    });
  }

  private folderForApi(api: string): string {
    const raw = String(api || 'OPEN_AI').toUpperCase().replace(/-/g, '_');
    return raw === 'X_AI' || raw === 'XAI' ? 'x-ai' : 'open-ai';
  }

  private parseIndex(payload: unknown): { id: string; embedding: number[] }[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    const wrapped = payload as { embeddings?: { id: string; embedding: number[] }[]; provider?: string };
    if (wrapped?.provider) {
      this.indexProvider = wrapped.provider;
    }
    return wrapped?.embeddings || [];
  }

  private async loadEmbeddingIndex() {
    let api = 'OPEN_AI';
    try {
      const activeRes = await fetch(ACTIVE_URL);
      if (activeRes.ok) {
        const active = await activeRes.json();
        api = active.EMBEDDINGS_API || api;
      }
    } catch {
      /* fall through to default */
    }
    this.indexProvider = api === 'X_AI' ? 'xai' : 'openai';
    const folder = this.folderForApi(api);
    const urls = [
      `assets/index/${folder}/article-embeddings.json`,
      LEGACY_INDEX_URL
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          continue;
        }
        this.index = this.parseIndex(await res.json());
        if (this.index.length) {
          return;
        }
      } catch {
        continue;
      }
    }
    this.index = [];
  }

  async ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const query = params.get('q');
      if (query) {
        this.query = query;
        this.getIndexAndSearch();
      }
    });
  }

  search() {
    const trimmed = this.query?.trim();
    if (trimmed) {
      this.router.navigate(['/search'], {
        queryParams: { q: trimmed }
      });
    }
  }

  loadMRUQueries() {
    const cache = JSON.parse(localStorage.getItem('queryCache') || '{}');
    const sorted = Object.entries(cache)
      .sort((a: any, b: any) => (b[1] as { lastUsed: number }).lastUsed - (a[1] as { lastUsed: number }).lastUsed)
      .slice(0, 5)
      .map((entry) => entry[0]);
    this.mruQueries = sorted;
  }

  onFocus() {
    if (!this.query) {
      this.loadMRUQueries();
      this.showDropdown = true;
    }
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  onQueryChange(value: string) {
    if (!value.trim()) {
      this.loadMRUQueries();
      this.showDropdown = true;
    } else {
      this.showDropdown = false;
    }
  }

  async performSearch() {
    const now = Date.now();
    const trimmedQuery = this.query.trim();
    if (!trimmedQuery) {
      return;
    }

    this.searching = true;
    this.searchError = '';
    this.results = [];

    try {
      const hits = await this.embeddingSearch(trimmedQuery, now);
      this.results = hits
        .sort((a, b) => b.score - a.score)
        .slice(0, RESULT_LIMIT);
      await this.hydrateResults();
      if (!this.results.length) {
        this.searchError = 'No matching articles or events.';
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.searchError = 'Search is temporarily unavailable.';
    } finally {
      this.searching = false;
    }
  }

  private async embeddingSearch(trimmedQuery: string, now: number): Promise<SearchHit[]> {
    const cacheStorageIndex = 'queryCache';
    let queryEmbedding: { results: number[]; lastUsed?: number };
    const queryCache = JSON.parse(localStorage.getItem(cacheStorageIndex) || '{}');
    const cached = queryCache[trimmedQuery];
    if (cached?.results) {
      queryEmbedding = cached;
      queryEmbedding.lastUsed = now;
    } else {
      queryEmbedding = await this.embedQuery(trimmedQuery);
      queryEmbedding.lastUsed = now;
    }
    queryCache[trimmedQuery] = queryEmbedding;
    localStorage.setItem(cacheStorageIndex, JSON.stringify(queryCache));

    const sample = this.index[0]?.embedding;
    if (!sample || sample.length !== queryEmbedding.results.length) {
      throw new Error('Embedding dimensions do not match the published index.');
    }

    return this.index.map((entry) => ({
      id: entry.id,
      kind: 'article' as const,
      score: this.cosineSimilarity(queryEmbedding.results, entry.embedding)
    }));
  }

  private async hydrateResults() {
    await Promise.all(
      this.results.map(async (result) => {
        if (result.kind === 'event') {
          if (!result.event) {
            result.event = await this.eventService.loadJsonEvent(result.id);
          }
          return;
        }
        result.article = await this.articleService.getArticle(result.id, ArticleState.ACTIVE);
      })
    );
  }

  resultLink(result: SearchHit): string[] {
    return result.kind === 'event' ? ['/event', result.id] : ['/article', result.id];
  }

  rememberResults(): void {
    this.browse.set(
      this.results.map((result) => ({ id: result.id, kind: result.kind })),
      this.router.url || '/search'
    );
  }

  resultTitle(result: SearchHit): string {
    return result.event?.header || result.article?.header || result.id;
  }

  resultSnippet(result: SearchHit): string {
    if (result.event) {
      return this.stripHtml(result.event.body || result.event.where || '');
    }
    return this.stripHtml(result.article?.body || '');
  }

  truncate(text: string, maxLength = 100): string {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

  stripHtml(html: string): string {
    return this.truncate(htmlToText(html), 150);
  }

  async embedQuery(query: string): Promise<{ results: number[]; provider?: string; lastUsed?: number }> {
    const response = await fetch(EMBEDDING_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: query
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API error: ${response.status} ${errorText}`);
    }

    const json = await response.json();
    return {
      results: json.data[0].embedding,
      provider: json.provider,
      lastUsed: Date.now()
    };
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] ** 2;
      magB += b[i] ** 2;
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}

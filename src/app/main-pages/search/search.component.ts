import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ArticleService } from '../../services/article.service';
import { Article, ArticleState } from '../../interfaces/article';
import { EventService } from '../../services/event.service';
import { BulletinEvent } from '../../interfaces/bulletin-event';
import { stripHtml as htmlToText } from '../../utils';
import { keywordScore, tfidfScore } from '../../utils/search-text';

const INDEX_URL = 'assets/index/article-embeddings.json';
const LEXICAL_INDEX_URL = 'assets/index/article-index.json';
const EMBEDDING_ENDPOINT = 'https://us-central1-auxilium-420904.cloudfunctions.net/generateEmbedding';
const RESULT_LIMIT = 10;

export interface SearchHit {
  id: string;
  score: number;
  kind: 'article' | 'event';
  article?: Article | null;
  event?: BulletinEvent | null;
}

interface LexicalEntry {
  id: string;
  vector: { term: string; tfidf: number }[];
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatGridListModule,
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
  lexicalIndex: LexicalEntry[] = [];
  results: SearchHit[] = [];
  mruQueries: string[] = [];
  showDropdown = false;

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private articleService: ArticleService,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  getPlaceholder() {
    return this.placeholder;
  }

  getIndexAndSearch() {
    const ready = this.index.length > 0 || this.lexicalIndex.length > 0;
    if (ready) {
      if (this.query) {
        this.performSearch();
      }
      return;
    }
    Promise.all([
      fetch(INDEX_URL).then((res) => (res.ok ? res.json() : [])).catch(() => []),
      fetch(LEXICAL_INDEX_URL).then((res) => (res.ok ? res.json() : [])).catch(() => [])
    ]).then(([embeddings, lexical]) => {
      if (Array.isArray(embeddings)) {
        this.index = embeddings;
        this.indexProvider = 'openai';
      } else {
        this.index = embeddings?.embeddings || [];
        this.indexProvider = embeddings?.provider || '';
      }
      this.lexicalIndex = Array.isArray(lexical) ? lexical : [];
      if (this.query) {
        this.performSearch();
      }
    });
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
      let articleHits: SearchHit[] = [];
      try {
        articleHits = await this.embeddingSearch(trimmedQuery, now);
      } catch (error) {
        console.warn('Embedding search unavailable, using keyword search.', error);
        articleHits = this.keywordArticleSearch(trimmedQuery);
      }
      if (!articleHits.length) {
        articleHits = this.keywordArticleSearch(trimmedQuery);
      }

      const eventHits = await this.keywordEventSearch(trimmedQuery);
      const merged = [...articleHits, ...eventHits].sort((a, b) => b.score - a.score);
      this.results = merged.filter((hit) => hit.score > 0).slice(0, RESULT_LIMIT);
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
      throw new Error('Embedding dimensions do not match the published index; using keyword search.');
    }

    return this.index.map((entry) => ({
      id: entry.id,
      kind: 'article' as const,
      score: this.cosineSimilarity(queryEmbedding.results, entry.embedding)
    }));
  }

  private keywordArticleSearch(query: string): SearchHit[] {
    return this.lexicalIndex
      .map((entry) => ({
        id: entry.id,
        kind: 'article' as const,
        score: tfidfScore(query, entry.vector || [])
      }))
      .filter((hit) => hit.score > 0);
  }

  private async keywordEventSearch(query: string): Promise<SearchHit[]> {
    const events = await this.eventService.fetchPublishedEvents();
    return events
      .map((event) => ({
        id: event.eventId,
        kind: 'event' as const,
        event,
        score: keywordScore(
          query,
          [event.header, event.where, event.schedule, event.dates, ...(event.tags || []), htmlToText(event.body)].join(' ')
        )
      }))
      .filter((hit) => hit.score > 0);
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

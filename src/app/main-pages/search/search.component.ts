import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from "@angular/router";

import { ArticleService } from '../../services/article.service';
import { Article } from '../../interfaces/article';

const INDEX_URL = 'assets/index/article-embeddings.json';
const EMBEDDING_ENDPOINT = 'https://us-central1-auxilium-420904.cloudfunctions.net/generateEmbedding';
const RESULT_LIMIT = 10;

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
  query = '';
  placeholder = 'Need help? Try “I need activity ideas for my kids."';
  index: { id: string, embedding: number[] }[] = [];
  results: { id: string, score: number, article?: Article | undefined | null }[] = [];
  mruQueries: string[] = [];
  showDropdown = false;

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor( private articleService: ArticleService, 
    private route: ActivatedRoute, private router: Router) {
    // Load index using native fetch
  }

  getPlaceholder() {
    return this.placeholder;
  }

  getIndexAndSearch() {
    if (this.index.length > 0) {
      if (this.query) {
        this.performSearch();
      }
      return;
    }
    fetch(INDEX_URL)
      .then(res => res.json())
      .then(data => {
        this.index = data;
        if (this.query) {
          this.performSearch();
        }
      })
      .catch(err => console.error('Failed to load index:', err));
  }

  async ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const query = params.get("q");
      if (query) {
        this.query = query;
        this.getIndexAndSearch();
      }
    });
  }

  search() {
    console.log('searching for:', this.query);
    const trimmed = this.query?.trim();
    if (trimmed){
      this.router.navigate(['/search'], {
        queryParams: { "q": trimmed }
      });
    }
  }

  loadMRUQueries() {
    const cache = JSON.parse(localStorage.getItem('queryCache') || '{}');
    const sorted = Object.entries(cache)
      .sort((a: any, b: any) => b[1].lastUsed - a[1].lastUsed)
      .slice(0, 5)
      .map(entry => entry[0]);
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
    }, 200); // delay to allow click selection
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
    const cacheStorageIndex = "queryCache";
    if (!trimmedQuery) return;

    let queryEmbedding: {results: number[], lastUsed?: number};

    const queryCache = JSON.parse(localStorage.getItem(cacheStorageIndex) || '{}');
    const cached = queryCache[trimmedQuery];
    if (cached) {
      queryEmbedding = cached;
      queryEmbedding.lastUsed = now;
    } else {
      queryEmbedding = await this.embedQuery(trimmedQuery);
      queryEmbedding.lastUsed = now;
    }
    queryCache[trimmedQuery] = queryEmbedding;
    localStorage.setItem(cacheStorageIndex, JSON.stringify(queryCache));

    const scoredResults = this.index.map(entry => ({
      id: entry.id,
      score: this.cosineSimilarity(queryEmbedding.results, entry.embedding)
    }));

    scoredResults.sort((a, b) => b.score - a.score);
    this.results = scoredResults.slice(0, RESULT_LIMIT);

    this.results.forEach(result => {
      this.articleService.fetchArticle(result.id).then(article => {
        result.article = article;
      })
    });    
  }

  truncate(text: string, maxLength = 100): string {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

  stripHtml(html: string): string {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return this.truncate(tempElement.textContent || tempElement.innerText || '', 150);
  }

  async embedQuery(query: string): Promise<{results: number[], lastUsed?: number}> {
    this.searching = true;
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
    this.searching = false;
    return {results: json.data[0].embedding, lastUsed: Date.now()};
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] ** 2;
      magB += b[i] ** 2;
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Article } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { ArticlePreviewCardComponent } from "../article-preview-card/article-preview-card.component";

@Component({
  selector: 'app-article-list',
  imports: [
    NgForOf,
    ArticlePreviewCardComponent,
    CommonModule,
    NgIf,
    MatProgressSpinner,
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss'
})
export class ArticleListComponent implements OnChanges {
  @Input() articles!: Article[];
  @Input() maxArticles: number = 5;
  @Input() maxArticlesPerRow: number = 2;
  @Input() category = "home";

  subCategories: Array<{ key: string; name: string; summary: string; articles: string[] }> = [];
  private expandedMap: Map<string, boolean> = new Map();
  private readonly charLimit = 500;
  private readonly minTruncationDelta = 100;

  constructor(public articleService: ArticleService) {}

  ngOnChanges() {
    if (this.category) {
      this.subCategories = this.articleService.getSubCategories(this.category);
    }
  }

  isExpanded(subCategory: { key: string }): boolean {
    return this.expandedMap.get(subCategory.key) || false;
  }

  toggleExpanded(subCategory: { key: string }): void {
    const current = this.isExpanded(subCategory);
    this.expandedMap.set(subCategory.key, !current);
  }

  isTruncatable(subCategory: { summary: string }): boolean {
    const plain = this.stripHtml(subCategory.summary || '');
    return plain.length > this.charLimit + this.minTruncationDelta;
  }

  getDisplayedSummary(subCategory: { key: string; summary: string }): string {
    const fullHtml = subCategory.summary;
  
    if (this.isExpanded(subCategory) || !this.isTruncatable(subCategory)) {
      return fullHtml;
    }
  
    // Parse HTML into DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
  
    let charCount = 0;
    let resultHtml = '';
  
    for (const p of paragraphs) {
      const text = p.textContent || '';
      if (charCount + text.length <= this.charLimit) {
        resultHtml += `<p>${p.innerHTML}</p>`;
        charCount += text.length;
      } else {
        const remaining = this.charLimit - charCount;
        const truncated = this.truncateToWord(text, remaining);
        resultHtml += `<p>${truncated}...</p>`;
        break;
      }
    }
  
    return resultHtml;
  }

  private stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private truncateToWord(text: string, limit: number): string {
    if (text.length <= limit) return text;
    const trimmed = text.slice(0, limit);
    const lastSpace = trimmed.lastIndexOf(' ');
    return trimmed.slice(0, lastSpace);
  }

  trackByHeader(index: number, article: Article): string | undefined {
    return article.header;
  }

  private spliceArticles(articles: Article[]): Article[] {
    return articles;
  }
}

import { Injectable, Inject } from '@angular/core';
import { Article, ArticlesMap, ArticleState } from "../interfaces/article";
import { Category } from "../interfaces/categories";
import { HttpClient } from "@angular/common/http";
import { LoginService } from './login.service';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

export class ArticleService {
  private articles: ArticlesMap = {
    PREVIEW: {}, 
    ACTIVE: {}
  };
  private baseHref: string;
  private currentCategory: Category | undefined;
  private categories: Category[] = [];
  
  public getCurrentCategory():Category | undefined {
    return this.currentCategory;
  }

  public setCurrentCategory(category:string) {
    this.currentCategory = this.getCategory(category);
  }

  public async loadCategories() {
    if (this.categories.length > 1) {
      return;
    }
    const url = `${this.baseHref}assets/categories.json`;
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return;
    }
    const data = await response.json();
    this.categories = data.categories;
  }

  public getSubCategories(categoryKey: string): Array<{ key: string; name: string; summary: string; articles: string[] }> {
    const category = this.getCategory(categoryKey);
    return category?.subCategories || [];
  }
  
  public getCategory(categoryKey: string):Category | undefined {
    return this.categories.find(cat => cat.key === categoryKey);
  }

  public subCategoryDetails: Record<string, string> = {
    "default": "",
    "activities": "Activities",
    "spiritual": "Spiritual",
    "virtues": "Virtues",
    "whole-child": "Whole Child",
  };

  public categoryDetails: Record<string, string> = {
    "high-school": "High School",
    "excellence": "Excellence"
  };

  public readonly defaultImageURI = "/assets/images/default-image.png";
  public readonly NEW_LABEL: string = "[ new ]";
  public readonly BASE_FIRESTORE: string = "https://firestore.googleapis.com/v1";

  constructor(@Inject(DOCUMENT) private document: Document, private http: HttpClient, private loginService: LoginService) {
    const baseElement = this.document.querySelector('base');
    this.baseHref = (baseElement ? baseElement.getAttribute('href') : '/')!;
  }
  
  private getHeaders() {
    const header:any =  {
      'Content-Type': 'application/json'
    }
    if (this.loginService.getIdToken()) {
      header['Authorization'] = `Bearer ${this.loginService.getIdToken()}`;
    }
    return header
  }

  public firebaseToArticle(document: any):Article {
    const fields = document?.fields;
    const name = document?.name;
    console.log(`name: ${name}`);
    const pattern = /[^/]+$/;
    const match = name?.match(pattern);
    let documentId: string = '';
    if (match) {
      documentId = match[0];
    }

    return {
      header: fields?.header?.stringValue?.toString() || '',
      body: fields?.body?.stringValue?.toString() || '',
      imageURI: fields?.imageURI ? fields.imageURI.stringValue : this.defaultImageURI,
      meta: {
        name: document?.name?.toString(),
        category: fields?.meta?.mapValue?.fields?.category?.stringValue || '',
        subCategory: fields?.meta?.mapValue?.fields?.subCategory?.stringValue || 'default',
        lastUpdated: fields?.meta?.mapValue?.fields?.lastUpdated?.timestampValue || '',
        documentId
      },
      articleId: fields?.articleId?.stringValue ?? crypto.randomUUID(),
    };
  }

  public isOld(articleId: string, retry: boolean = false): boolean {
    if (!this.articles.ACTIVE[articleId]) {
      if (retry) {
        return false;
      }
      this.loadJsonArticle(articleId);  
      this.isOld(articleId, true);
    }
    const previewLastUpdated = this.articles.PREVIEW[articleId]?.meta.lastUpdated || '';
    const activeUpdated = this.articles.ACTIVE[articleId]?.meta.lastUpdated || '';
    return previewLastUpdated !== activeUpdated;
  }

  public async getArticle(articleId: string, state: ArticleState): Promise<Article | null | undefined> {
    try {
      if (this.articles[state] && this.articles[state][articleId]) {
        return this.articles[state][articleId];
      }

      let article: Article | null | undefined;
      if (state === ArticleState.PREVIEW) {
        article = await this.fetchFromFirestore(articleId);
      } else {
        article = await this.loadJsonArticle(articleId);
      }
      this.articles[state][articleId] = article || null;
      return article;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return null;
    }
  }

  public async loadJsonArticle(articleId: string): Promise<Article | null> {
    try {
      const url = `${this.baseHref}assets/data/articles/${articleId}.json`
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }
      const document = await response.json();
      // If documents does not contain the document element, return null
      if (!document) {
        console.log("Document not found");
        return null;
      }

      const cacheArticle = this.firebaseToArticle(document.document)
      this.articles[ArticleState.ACTIVE][articleId] = cacheArticle;

      return cacheArticle!;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return null;
    }
  }

  public async fetchUpdateDate(): Promise<string | null | undefined> {
    try {
      const url = `${this.baseHref}assets/data/update.json`
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }
      const updateJson = await response.json();
      return updateJson.lastUpdated;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return null;
    }
  }

  public async fetchPendingArticles(): Promise<{ lastUpdated: string | undefined | null; articles: Array<Article> }| null> {
    try {
      const lastUpdated:string | undefined | null = await this.fetchUpdateDate();
      const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'articles' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'meta.lastUpdated' },
                op: 'GREATER_THAN', // Fetch articles updated after the given timestamp
                value: { timestampValue: lastUpdated }
              }
            }
          }
        })
      });  

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }
      const articles = await response.json();
      let articleCount = 0;
      const articleList: Article[] = [];
      articles.forEach((entry:any, index: number) => {
        if (entry.document) {
          const artcicle:Article = this.firebaseToArticle(entry.document);
          articleList.push(artcicle);
        }
      }); 
      return { lastUpdated, articles: articleList };
    } catch (error) {
      console.error('Error fetching articles:', error);
      return {lastUpdated: '', articles: []};
    }
  };

  public async fetchFromFirestore(articleId: string): Promise<Article | null> {
    try {
      const response = await fetch(`${this.BASE_FIRESTORE}/projects/auxilium-420904/databases/aux-db/documents:runQuery`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'articles' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'articleId' },
                op: 'EQUAL',
                value: { stringValue: articleId }
              }
            }
          }
        })
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }
      const documents = await response.json();
      // If documents does not contain the document element, return null
      if (!documents || !documents[0].document) {
        return null;
      }
      const document = documents[0].document;
      this.articles[ArticleState.PREVIEW][articleId] = this.firebaseToArticle(document);
      return this.articles[ArticleState.PREVIEW][articleId]!;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return null;
    }
  };

  saveArticle = async (article: Article) => {
    try {
      const documentId = article.meta?.documentId;
      const { body, header, imageURI, meta } = article;
      const documentName = article.meta?.name;
      const category = meta?.category;
      const subCategory = meta?.subCategory;

      const fieldPaths = ['body', 'header', 'imageURI', 'meta'];
      const updateMask = fieldPaths.map(field => `updateMask.fieldPaths=${field}`).join('&');
      const NEW_ARTICLE_URL = `${this.BASE_FIRESTORE}/projects/auxilium-420904/databases/aux-db/documents/articles`;
      const firestorePath = documentId === this.NEW_LABEL ? NEW_ARTICLE_URL: `${this.BASE_FIRESTORE}/${documentName}?${updateMask}`;
      const method = documentId === this.NEW_LABEL ? "POST" : "PATCH";


      const lastUpdated: string = new Date().toISOString();
      const response = await fetch(firestorePath, {
        method,
        headers: this.getHeaders(),
        body: JSON.stringify({
            "fields": {
              "articleId": {
                "stringValue": article.articleId
              },
              "body": {
                "stringValue": body || ''
              },
              "header": {
                "stringValue": header || ''
              },
              "imageURI": {
                "stringValue": imageURI || ''
              },
              "meta": {
                "mapValue": {
                  "fields": {
                    "category": {
                      "stringValue": category || ''
                    },
                    "subCategory": {
                      "stringValue": subCategory || ''
                    },
                    "lastUpdated": {
                      "timestampValue": lastUpdated
                    }
                  }
                }
              }
            }
          }
        )
      });

      return response.ok;

    } catch (error) {
      console.error('Error fetching articles:', error);
      return false;
    }
  };
}

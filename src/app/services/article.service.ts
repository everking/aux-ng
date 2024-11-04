import { Injectable, Inject } from '@angular/core';
import { Article, INVALID_ARTICLE } from "../interfaces/article";
import { from, map, Observable, of, switchMap, take } from "rxjs";
import { getHardcodedArticle } from './hardcoded.article';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LoginService } from './login.service';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

export class ArticleService {
  private articles: Article[] = [];
  private articleMap: Map<string, Article> = new Map();
  private baseHref: string;
  private featuredArticles: string[] = [
    "stories",
    "church-construction-complete",
    "is-peter-rock",
    "why-not-catholic",
    "church-construction-complete",
    "is-peter-rock",
    "why-not-catholic",
  ];

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

  public getSubCategory(subCategory: string, category: string = '') {
    if (category && subCategory === "default") {
      return this.categoryDetails[category];
    } else {
      return this.subCategoryDetails[subCategory];
    }
  }

  public readonly defaultImageURI = "https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg";
  public readonly NEW_LABEL: string = "[ new ]";
  public readonly BASE_FIRESTORE: string = "https://firestore.googleapis.com/v1";

  constructor(@Inject(DOCUMENT) private document: Document, private http: HttpClient, private loginService: LoginService) {
    const baseElement = this.document.querySelector('base');
    this.baseHref = (baseElement ? baseElement.getAttribute('href') : '/')!;
  }

  public getSingleArticle(articleId: string | null): Observable<Article> {
    if (this.articleMap.get(articleId!)) {
      return of(this.articleMap.get(articleId!)!);
    }
    return this.getAllArticles().pipe(
      take(1),
      switchMap(() => {
        // Convert the Promise (if returned) to an Observable using 'from'
        const firestoreArticle$ = from(this.fetchArticleFromFirestore(articleId!));
        return firestoreArticle$.pipe(
          switchMap(article => {
            const localArticle = article ?? this.articles.find(article => article.articleId === articleId);
            return of(localArticle || INVALID_ARTICLE);
          })
        );
      })
    );
  }

  public getAllArticles(): Observable<Article[]> {
    if (this.articles?.length) {
      return of(this.articles);
    } else {
      // Obtain featured articles from firestore
      return this.fetchAllArticlesFromFirestore(true);
    }
  }

  // unused for now.
  private async getFeaturedArticles(): Promise<Article[]> {
    try {
      const fetchedArticles = await Promise.all(
        this.featuredArticles.map(async (articleId) => {
          try {
            const cachedArticle = this.articleMap.get(articleId);
            const fetchedArticle = cachedArticle ?? await this.fetchArticleFromFirestore(articleId);
            return fetchedArticle ?? getHardcodedArticle(articleId);
          } catch (error) {
            console.error(`Failed to fetch article with ID: ${articleId}`, error);
            return []; // Return empty if there's an error
          }
        })
      );

      // Filter out any null values
      this.articles = fetchedArticles.filter((article): article is Article => article !== null);

    } catch (error) {
      console.error("Error loading articles", error);
    }
    return this.articles;
  };

  public fetchAllArticlesFromFirestore(useLocal:boolean = false): Observable<Article[]> {
    const url = useLocal ? `${this.baseHref}assets/data/all-articles.json` : `${this.BASE_FIRESTORE}/projects/auxilium-420904/databases/aux-db/documents:runQuery`;
    const headers: HttpHeaders = new HttpHeaders(this.getHeaders());
    const body = {
      structuredQuery: {
        from: [{collectionId: 'articles'}],
      }
    };

    return (useLocal ? this.http.get(url) : this.http.post(url, body, {headers})).pipe(
      map((documents: any): Article[] => {

        const fetchedArticles: Article[] = [];
        documents.forEach((document: any) => {
          const fields = document.document.fields;
          let documentId: string = '';

          /* Todo: This is bad. We need our database to adhere to the contract of data blobs that we expect.
              There is not a single article in the firestore that contains all requirements of the Article interface.
          */
          const article: Article = {
            header: fields?.header?.stringValue?.toString() || '',
            body: fields?.body?.stringValue?.toString() || '',
            imageURI: fields?.imageURI ? fields.imageURI.stringValue : this.defaultImageURI,
            meta: {
              name: document?.name?.toString(),
              documentId,
              category: fields?.meta?.mapValue?.fields?.category?.stringValue || '',
              subCategory: fields?.meta?.mapValue?.fields?.subCategory?.stringValue || 'default',
            },
            articleId: fields?.articleId?.stringValue ?? crypto.randomUUID(),
          };

          fetchedArticles.push(article);
          this.articleMap.set(article.articleId, article);
        });
        // Cache the fetched articles
        this.articles = fetchedArticles;
        // return them
        return fetchedArticles;
      }),
    );
  }

  private getHeaders() {
    const header:any =  {
      'Content-Type': 'application/json'
    }
    if (this.loginService.idToken) {
      header['Authorization'] = `Bearer ${this.loginService.idToken}`;
    }
    return header
  }

  public async fetchArticleFromFirestore(articleId: string): Promise<Article | null> {
    try {
      if (this.articleMap.get(articleId)) {
        return this.articleMap.get(articleId)!;
      }
      // Fix for not fetching hard coded items until not needed.
      if (this.articles.length) {
        const article = this.articles.find(article => article.articleId === articleId);
        if (article) {
          return article;
        }
      }
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
      const returnedDocument = documents[0].document;

      const fields = returnedDocument?.fields;
      const name = returnedDocument?.name;
      const pattern = /[^/]+$/;
      const match = name?.match(pattern);
      let documentId: string = '';
      if (match) {
        documentId = match[0];
      }

      this.articleMap.set(articleId, {
        header: fields.header?.stringValue.toString() || '',
        body: fields.body?.stringValue.toString() || '',
        imageURI: fields?.imageURI ? fields?.imageURI?.stringValue : this.defaultImageURI,
        meta: {
          name: returnedDocument.name.toString(),
          documentId,
          category: fields.meta?.mapValue.fields.category?.stringValue || '',
          subCategory: fields.meta?.mapValue.fields.subCategory?.stringValue || '',
        },
        articleId: articleId,
      });
      return this.articleMap.get(articleId)!;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return null;
    }
  };

  saveArticle = async (article: Article) => {
    console.log(`GET articleId: ${article.articleId}`);
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

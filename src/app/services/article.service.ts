import { Injectable } from '@angular/core';
import { Article } from "../interfaces/article";
import { from, Observable, of, switchMap, take } from "rxjs";
import { getHardcodedArticle } from './hardcoded.article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private articles: Article[] = [];
  private featuredArticles: string[] = [
    "stories",
    "church-construction-complete",
    "is-peter-rock",
    "why-not-catholic"
  ];
  public defaultImageURI = "https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg";
  public NEW_LABEL:string = "[ new ]";
  public BASE_FIRESTORE: string = "https://firestore.googleapis.com/v1";

  constructor() {
  }

  public getSingleArticle(articleId: string | null): Observable<Article> {
    return this.getAllArticles().pipe(take(1),
      switchMap(() => {
        const article = this.articles.find(article => article.articleId === articleId);
        return of(article || {
          header: 'invalid-article',
          body: 'invalid-article',
          imageURI: 'none',
          subCategory: 'Article',
          articleId: 'invalid-article'
        });
      }));
  }

  public getAllArticles(): Observable<Article[]> {
    if (this.articles?.length) {
      return of(this.articles);
    } else {
      // Obtain featured articles from firestore
      return from(this.getFeaturedArticles()).pipe(
        switchMap(() => of(this.articles))
      );
    }
  }

  private async getFeaturedArticles(): Promise<Article[]> {
    try {
      const fetchedArticles = await Promise.all(
        this.featuredArticles.map(async (articleId) => {
          try {
            const fetchedArticle = await this.fetchArticleFromFirestore(articleId);
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

  public async fetchArticleFromFirestore(articleId: string): Promise<Article | null> {
    try {
      const response = await fetch(`${this.BASE_FIRESTORE}/projects/auxilium-420904/databases/aux-db/documents:runQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
      return {
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
      };
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
        headers: {
          'Content-Type': 'application/json'
        },
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

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      await response.json();

    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };
}

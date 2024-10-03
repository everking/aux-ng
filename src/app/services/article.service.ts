import {Injectable} from '@angular/core';
import {Article} from "../interfaces/article";
import {from, Observable, of, switchMap, take} from "rxjs";
import {getHardcodedArticle} from './hardcoded.article';

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
  private defaultImageURI = "https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg";

  constructor() {
  }

  public readOne(articleId: string | null): Observable<Article> {
    return this.readAll().pipe(take(1),
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

  public readAll(): Observable<Article[]> {
    if (this.articles?.length) {
      return of(this.articles);
    } else {
      // Obtain articles from firestore
      return from(this.loadArticles()).pipe(
        switchMap(() => of(this.articles))
      );
    }
  }

  private async loadArticles(): Promise<Article[]> {
    try {
      const fetchedArticles = await Promise.all(
        this.featuredArticles.map(async (articleId) => {
          try {
            const fetchedArticle = await this.getArticle(articleId);
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

  private async getArticle(articleId: string): Promise<Article | null> {
    try {
      const response = await fetch('https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery', {
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
        header: fields.title.stringValue.toString(),
        body: fields.body.stringValue.toString(),
        imageURI: fields?.imageURI ? fields?.imageURI?.stringValue : this.defaultImageURI,
        meta: {
          name: returnedDocument.name.toString(),
          documentId,
          category: fields.meta.mapValue.fields.category.stringValue,
          subCategory: fields.meta.mapValue.fields.subCategory.stringValue,
        },
        articleId: articleId,
      };
    } catch (error) {
      console.error('Error fetching articles:', error);
      return null;
    }
  };

}

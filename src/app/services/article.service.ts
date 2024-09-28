import { Injectable } from '@angular/core';
import { Article } from "../interfaces/article";
import { HttpClient } from "@angular/common/http";
import { delay, switchMap, from, Observable, of, tap } from "rxjs";
import { getHardcodedArticles, getHardcodedArticle } from './hardcoded.article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private articles: Article[] | null = [];
  private featuredArticles: string[] = [
    "stories", 
    "church-construction-complete", 
    "is-peter-rock", 
    "why-not-catholic"
  ];
  private defaultImageURI = "https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg";
  constructor(private http: HttpClient) {
  }

  loadArticles = async () => {
    try {
      const fetchedArticles = await Promise.all(
        this.featuredArticles.map(async (articleId) => {
          try {
            const fetchedArticle = await this.getArticle(articleId);
            return fetchedArticle ?? getHardcodedArticle(articleId);
          } catch (error) {
            console.error(`Failed to fetch article with ID: ${articleId}`, error);
            return null; // Return null if there's an error
          }
        })
      );
  
      // Filter out any null values
      this.articles = fetchedArticles.filter((article): article is Article => article !== null);
  
      console.log('Articles loaded:', this.articles);
    } catch (error) {
      console.error("Error loading articles", error);
    }
  };
  
  // Call the function to load articles  
  
  getArticleList(): Observable<Article[]> {
    // Use 'from' to convert the Promise returned by loadArticles to an Observable
    return from(this.loadArticles()).pipe(
      // Switch to returning this.articles if it's available after loading
      switchMap(() => {
        if (this.articles?.length) {
          return of(this.articles); // Return the articles if already loaded
        }
  
        // Fallback to hardcoded articles after delay if this.articles is empty
        return of(getHardcodedArticles()).pipe(
          delay(1500), // Simulate delay (e.g., loading time)
          tap((articles: Article[]) => this.articles = articles) // Update this.articles
        );
      })
    );
  }
  readOne(articleId: string): Observable<Article> {
    return of(getHardcodedArticles().find((article: Article) => article.articleId === articleId) || {
      header: 'invalid-article',
      body: 'invalid-article',
      imageURI: 'none',
      subCategory: 'Article',
      articleId: 'invalid-article'
    });
  }

  saveArticleBody = async (article:Article) => {
    console.log(`GET articleId: ${article.articleId}`);
    try {
      const documentId = article.meta?.documentId;
      const { body, header, imageURI, meta } = article;
      const documentName = article.meta?.name;
      const category = meta?.category;
      const subCategory = meta?.subCategory;

      const response = await fetch(`https://firestore.googleapis.com/v1/${documentName}?updateMask.fieldPaths=body&updateMask.fieldPaths=title`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "fields": {
            "body": {
              "stringValue": body
            },
            "header": {
              "stringValue": header
            },
            "imageURI": {
              "stringValue": imageURI
            },
            "meta": {
              "mapValue": {
                "fields": {
                  "category": {
                    "stringValue": category
                  },
                  "subCategory": {
                    "stringValue": subCategory
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
  }  

  getArticle = async (articleId: string) => {
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
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const documents = await response.json();
      if (documents.length > 0) {
        const fields = documents[0].document.fields;
        const name = documents[0].document.name;
        const pattern = /[^/]+$/;
        const match = name.match(pattern);
        let documentId: string = '';
        if (match) {
          documentId = match[0];
        }
        const article: Article = {
          header: fields.title.stringValue.toString(),
          body: fields.body.stringValue.toString(),
          imageURI: fields.imageURI ? fields.imageURI.stringValue : this.defaultImageURI,
          meta: {
            name: documents[0].document.name.toString(),
            documentId,
            category: fields.meta.mapValue.fields.category.stringValue,
            subCategory: fields.meta.mapValue.fields.subCategory.stringValue,
          },
          articleId
        };
        return article;
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
    return null;
  };

}

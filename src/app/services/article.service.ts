import { Injectable } from '@angular/core';
import { Article } from "../interfaces/article";
import { HttpClient } from "@angular/common/http";
import { delay, Observable, of, tap } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private articles: Article[] = [];

  private simulatedArticles: Article[] = [
    {
      imageLocation: 'https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg',
      headerText: 'Church Construction Complete!',
      descriptionText: 'Just completed the large 20,000 sqft Cathedral is bound to draw many people!',
      subCategory: 'Spiritual',
      articleId: "church-construction-complete"
    },
    {
      imageLocation: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
      headerText: 'Is Peter \'Rock?\'',
      descriptionText: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
      subCategory: 'Article',
      articleId: "is-peter-rock"
    },
    {
      imageLocation: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
      headerText: 'Why are you not Catholic?',
      descriptionText: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
      subCategory: 'Politics',
      articleId: "why-not-catholic"
    },
    {
      imageLocation: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
      headerText: 'Is Peter \'Rock?\'',
      descriptionText: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
      subCategory: 'Article',
      articleId: "is-peter-rock"
    },
    {
      imageLocation: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
      headerText: 'Why are you not Catholic?',
      descriptionText: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
      subCategory: 'Politics',
      articleId: "why-not-catholic"
    },
    {
      imageLocation: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
      headerText: 'Is Peter \'Rock?\'',
      descriptionText: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
      subCategory: 'Article',
      articleId: "is-peter-rock"
    },
    {
      imageLocation: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
      headerText: 'Why are you not Catholic?',
      descriptionText: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
      subCategory: 'Politics',
      articleId: "why-not-catholic"
    },
  ];

  constructor(private http: HttpClient) {

  }

  read(): Observable<Article[]> {
    if (this.articles.length) {
      return of(this.articles);
    }

    return of(this.simulatedArticles).pipe(
      delay(1500),
      tap((articles: Article[]) => this.articles = articles),
    )
  }

  readOne(articleId: string): Observable<Article> {
    return of(this.simulatedArticles.find((article: Article) => article.articleId === articleId) || {
      headerText: 'invalid-article',
      descriptionText: 'invalid-article',
      imageLocation: 'none',
      subCategory: 'Article',
      articleId: 'invalid-article'
    });
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
        let documentId = '';
        if (match) {
          documentId = match[0];
        }
        const articleData = {
          title: fields.title.stringValue,
          body: fields.body.stringValue,
          name: documents[0].document.name,
          documentId,
          articleId
        };
        return articleData;
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
    return null;
  };

}

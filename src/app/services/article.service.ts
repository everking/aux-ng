import {Injectable} from '@angular/core';
import {Article} from "../interfaces/article";
import {HttpClient} from "@angular/common/http";
import {delay, Observable, of, tap} from "rxjs";

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

  readOne() {

  }

  update() {

  }

  delete() {

  }

  create() {

  }
}

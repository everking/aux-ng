import {Component, Input, OnInit} from '@angular/core';
import {Article} from "../../interfaces/article";
import {NgForOf} from "@angular/common";
import {ArticlePreviewComponent} from "../article-preview/article-preview.component";

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    NgForOf,
    ArticlePreviewComponent
  ],
  templateUrl: './article-list.component.html',
  styleUrl: './article-list.component.scss'
})
export class ArticleListComponent implements OnInit {
  @Input() articles!: Article[];

  ngOnInit() {
    this.articles = [
      {
        imageLocation: 'https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg',
        headerText: 'Church Construction Complete!',
        descriptionText: 'Just completed the large 20,000 sqft Cathedral is bound to draw many people!',
        subCategory: 'Spiritual'
      },
      {
        imageLocation: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
        headerText: 'Is Peter \'Rock?\'',
        descriptionText: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
        subCategory: 'Article'
      },
      {
        imageLocation: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
        headerText: 'Why are you not Catholic?',
        descriptionText: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
        subCategory: 'Politics'
      },
      {
        imageLocation: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
        headerText: 'Is Peter \'Rock?\'',
        descriptionText: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
        subCategory: 'Article'
      },
      {
        imageLocation: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
        headerText: 'Why are you not Catholic?',
        descriptionText: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
        subCategory: 'Politics'
      },
      {
        imageLocation: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
        headerText: 'Is Peter \'Rock?\'',
        descriptionText: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
        subCategory: 'Article'
      },
      {
        imageLocation: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
        headerText: 'Why are you not Catholic?',
        descriptionText: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
        subCategory: 'Politics'
      },
    ];
  }

  trackByHeader(index: number, article: Article): string {
    return article.headerText;
  }
}

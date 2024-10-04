import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ArticleService} from '../../services/article.service';
import {FormsModule} from '@angular/forms';
import {AngularEditorConfig, AngularEditorModule} from '@kolkov/angular-editor';
import { Article } from '../../interfaces/article';

@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [FormsModule, AngularEditorModule],
  templateUrl: './edit-article.component.html',
  styleUrl: './edit-article.component.css'
})

export class EditArticleComponent implements OnInit {
  articleId!: string;
  header?: string = '';
  body?: string = '';
  documentId?: string = '';
  name?: string = '';
  category?: string = '';
  subCategory?: string = '';
  imageURI?: string = '';

  constructor(private route: ActivatedRoute, private articleService: ArticleService) {}
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Enter text here...',
    translate: 'no',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['bold', 'italic'],
    ]
  };

  onSaveClick(): void {
    const article: Article = {
      articleId: this.articleId,
      header: this.header || '',
      imageURI: this.imageURI || '',
      body: this.body || '',
      meta: {
        documentId: this.documentId,
        name: this.name,
        category: this.category,
        subCategory: this.subCategory
      }
    };
    this.articleService.saveArticleBody(article);
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    this.articleService.fetchArticleFromFirestore(this.articleId).then((article)=> {
      this.body = article?.body;
      this.header = article?.header;
      this.imageURI = article?.imageURI || this.articleService.defaultImageURI;
      this.documentId = article?.meta?.documentId;
      this.category = article?.meta?.category;
      this.subCategory = article?.meta?.subCategory;
      this.name = article?.meta?.name;
    })
    /*
    this.articleService.getSingleArticle(this.articleId).subscribe((article) => {
      console.log(JSON.stringify(article, null, 2));
      this.body = article.body;
      this.header = article.header;
      this.documentId = article.meta?.documentId;
      this.name = article.meta?.name;
    });
    */
  }
}

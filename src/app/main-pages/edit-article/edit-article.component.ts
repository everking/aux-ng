import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ArticleService} from '../../services/article.service';
import {FormsModule} from '@angular/forms';
import {AngularEditorConfig, AngularEditorModule} from '@kolkov/angular-editor';
import { Article } from '../../interfaces/article';
import { ImageDropComponent } from '../image-drop/image-drop.component';
@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [FormsModule, AngularEditorModule, ImageDropComponent],
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

  onImageDropped(image: string) {
    this.imageURI = image;
  }

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
    this.articleService.saveArticle(article);
  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    this.articleService.fetchArticleFromFirestore(this.articleId).then((article)=> {
      console.log("fetchy");
      this.body = article?.body;
      this.header = article?.header;
      this.imageURI = article?.imageURI || '';
      this.documentId = article?.meta?.documentId || this.articleService.NEW_LABEL;
      this.category = article?.meta?.category;
      this.subCategory = article?.meta?.subCategory;
      this.name = article?.meta?.name || this.articleService.NEW_LABEL;
    })
  }
}

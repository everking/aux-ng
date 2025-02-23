import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { FormsModule, FormGroup, FormControl } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { Article } from '../../interfaces/article';
import { ImageDropComponent } from '../image-drop/image-drop.component';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-edit-article',
  imports: [
    FormsModule,
    AngularEditorModule, 
    ImageDropComponent,
    CommonModule
  ],
  templateUrl: './edit-article.component.html',
  styleUrl: './edit-article.component.css'
})

export class EditArticleComponent implements OnInit {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  articleId!: string;
  header?: string = '';
  body?: string = '';
  documentId?: string = '';
  name?: string = '';
  category?: string = '';
  subCategory?: string = '';
  imageURI?: string = '';
  saveMessage: string = '';
  changed: boolean = false;
  editForm = new FormGroup({
    header: new FormControl(''),
    category: new FormControl(''),
    subCategory: new FormControl('')
  });

  constructor(private route: ActivatedRoute,
    private articleService: ArticleService,
    private loginService: LoginService,
    private router: Router
  ) {}

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

  onArticleChange(content: string) {
    this.changed = true;
  }

  onFieldChange() {
    this.changed = true;
  }

  get formChanged(): boolean {
    return this.editForm.dirty; // `dirty` means any field has changed
  }

  onImageDropped(image: string) {
    this.imageURI = image;
    this.changed = true;
  }

  hasChanged() {
    return this.changed;
  }
  
  onPreview() {
    this.router.navigate([`/preview/${this.articleId}`]);
  }

  async onSaveClick() {
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
    const isSaved:boolean = await this.articleService.saveArticle(article);
    if (isSaved) {
      this.saveMessage = "Saved!";
      console.log("Saved!");
      this.changed = true;
    } else {
      this.saveMessage = "Sorry. Not saved!";
      console.log("Sorry. Not saved!");
    }

  }

  ngOnInit(): void {
    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    if (!this.loginService.getIdToken()) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/edit-article/${this.articleId}` }});
    }

    this.articleService.fetchArticleFromFirestore(this.articleId).then((article)=> {
      this.body = article?.body;
      this.header = article?.header;
      this.imageURI = article?.imageURI || '';
      this.documentId = article?.meta?.documentId || this.articleService.NEW_LABEL;
      this.category = article?.meta?.category;
      this.subCategory = article?.meta?.subCategory;
      this.name = article?.meta?.name || this.articleService.NEW_LABEL;
      this.changed = false;
    })
  }
}

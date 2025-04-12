import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { ArticleState } from '../../interfaces/article';
import { FormsModule, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule, UploadResponse } from '@kolkov/angular-editor';
import { Article } from '../../interfaces/article';
import { ImageDropComponent } from '../image-drop/image-drop.component';
import { LoginService } from '../../services/login.service';
import {Observable, Observer} from 'rxjs';
import {HttpEvent, HttpResponse} from '@angular/common/http';

@Component({
  selector: 'app-edit-article',
  imports: [
    FormsModule,
    AngularEditorModule, 
    ImageDropComponent,
    ReactiveFormsModule,
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
  public isEditing = false;
  embedImageProps = {
    width: 384,
    height: 216
  }

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
    placeholder: 'Start writing article here...',
    translate: 'no',
    defaultFontName: 'EB Garamond',
    upload: (file: File): Observable<HttpEvent<UploadResponse>> => {
      return new Observable((observer: Observer<HttpEvent<UploadResponse>>) => {
        this.resizeAndCropImage(file, this.embedImageProps.width,  this.embedImageProps.height).then((base64Image) => {
          observer.next(new HttpResponse({ body: { imageUrl: base64Image } }));
          observer.complete();
        }).catch((error) => {
          console.error('Error processing image:', error);
          observer.error(error);
        });
      });
    },
    toolbarHiddenButtons: [
      ['fontName'],
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
  
  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  onCancelClick() {
    this.router.navigate([`/article/${this.articleId}`]);
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
      await this.articleService.fetchFromFirestore(this.articleId);
      this.saveMessage = "Saved!";
      console.log("Saved!");
      this.changed = true;
      this.router.navigate([`/preview/${this.articleId}`]);
    } else {
      this.saveMessage = "Sorry. Not saved!";
      console.log("Sorry. Not saved!");
    }

  }

  ngOnInit(): void {
    const localEmbedImageProps = localStorage.getItem('embedImageProps');
    if (localEmbedImageProps) {
      this.embedImageProps = JSON.parse(localEmbedImageProps);
    } else {
      /* Save default embed image properties */
      localStorage.setItem('embedImageProps', JSON.stringify(this.embedImageProps));
    }

    this.articleId = this.route.snapshot.paramMap.get('articleId') || '';
    if (!this.loginService.getIdToken()) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/edit-article/${this.articleId}` }});
    }

    this.articleService.fetchFromFirestore(this.articleId).then((article)=> {
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

  async resizeAndCropImage(file: File, width: number, height: number): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const resizedHeight = Math.round(width / aspectRatio);
  
          const finalHeight = height === 0 ? resizedHeight : height;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
  
          canvas.width = width;
          canvas.height = finalHeight;
  
          if (height === 0) {
            // No cropping needed, just draw the resized image
            console.log(`Resizing to ${width}x${resizedHeight} (no crop)`);
            ctx.drawImage(img, 0, 0, width, resizedHeight);
          } else {
            // Crop vertically to center
            const cropY = Math.max(0, (resizedHeight - height) / 2);
            console.log(`Resizing to ${width}x${resizedHeight}, then cropping to ${width}x${height} from y=${cropY}`);
            ctx.drawImage(img, 0, -cropY, width, resizedHeight);
          }
  
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    });
  }

  insertImage(base64Image: string) {
    document.execCommand('insertImage', false, base64Image);
  }
}

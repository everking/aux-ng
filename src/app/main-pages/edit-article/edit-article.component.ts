import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ArticleService} from '../../services/article.service';
import {FormsModule} from '@angular/forms';
import {AngularEditorConfig, AngularEditorModule} from '@kolkov/angular-editor';

@Component({
  selector: 'app-edit-article',
  standalone: true,
  imports: [FormsModule, AngularEditorModule],
  templateUrl: './edit-article.component.html',
  styleUrl: './edit-article.component.css'
})

export class EditArticleComponent implements OnInit {
  topic!: string;
  articleTitle?: string = '';
  articleBody?: string = '';

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

  ngOnInit(): void {
    this.topic = this.route.snapshot.paramMap.get('topic') || '';
    this.articleService.getSingleArticle(this.topic).subscribe((article) => {
      console.log(article);
      this.articleBody = article.body;
      this.articleTitle = article.header;
    });
  }
}

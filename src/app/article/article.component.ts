import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-article',
  standalone: true,
  imports: [],
  templateUrl: './article.component.html',
  styleUrl: './article.component.css'
})
export class ArticleComponent implements OnInit {
  topic: string = '';
  articleTitle: string = '';
  articleBody: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Capture the 'topic' parameter from the URL
    this.topic = this.route.snapshot.paramMap.get('topic') || '';
    this.getArticle(this.topic).then((article) => {
      console.log(article);
      this.articleBody = article?.body;
      this.articleTitle = article?.title;
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
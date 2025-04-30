import { Component } from '@angular/core';
import { ArticleService } from '../../services/article.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  rosaryInfo: string = '';
  rosaryLink: string = '';

  constructor(private articleService:ArticleService) {

  }
  ngOnInit() {
    interface Mystery {
      name: string;
      link: string;
    }
    
    const rosaryBaseUrl = "https://servant-savio.github.io/mystic/rosary";
    const mysteries: Record<string, Mystery> = {
      "Sunday": {
        "name": "Glorious Mysteries",
        "link": "glorious-mysteries"
      },
      "Monday": {
        "name": "Joyful Mysteries",
        "link": "joyful-mysteries"
      },
      "Tuesday": {
        "name": "Sorrowful Mysteries",
        "link": "sorrowful-mysteries"
      },
      "Wednesday": {
        "name": "Glorious Mysteries",
        "link": "glorious-mysteries"
      },
      "Thursday": {
        "name": "Luminous Mysteries",
        "link": "luminous-mysteries"
      },
      "Friday": {
        "name": "Sorrowful Mysteries",
        "link": "sorrowful-mysteries"
      },
      "Saturday": {
        "name": "Joyful Mysteries",
        "link": "joyful-mysteries"
      }
    };
    this.articleService.setCurrentCategory("");
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', options);
    this.rosaryInfo = mysteries[dayName].name;
    this.rosaryLink = `/article/${mysteries[dayName].link}`;
  }
}

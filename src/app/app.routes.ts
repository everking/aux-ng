import { Routes } from '@angular/router';
import { HomeComponent } from "./main-pages/home/home.component";
import { FamilyComponent } from "./main-pages/family/family.component";
import { SchoolComponent } from "./main-pages/school/school.component";
import { ExcellenceComponent } from "./main-pages/excellence/excellence.component";
import { AskComponent } from "./main-pages/ask/ask.component";
import { ArticleComponent } from "./article/article.component";
import { EditArticleComponent } from "./main-pages/edit-article/edit-article.component";
import { ParameterComponent } from "./main-pages/parameter/parameter.component";
import { ImageDropComponent } from './main-pages/image-drop/image-drop.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'family', component: FamilyComponent },
  { path: 'school', component: SchoolComponent },
  { path: 'excellence', component: ExcellenceComponent },
  { path: 'image-drop', component: ImageDropComponent },
  { path: 'ask', component: AskComponent },
  { path: 'article/:articleId', component: ArticleComponent },
  { path: 'edit-article/:articleId', component: EditArticleComponent },
  { path: '', component: ParameterComponent }
];

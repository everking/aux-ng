import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FamilyComponent } from './family/family.component';
import { SchoolComponent } from './school/school.component';
import { ExcellenceComponent } from './excellence/excellence.component';
import { AskComponent } from './ask/ask.component';
import { ArticleComponent } from './article/article.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'family', component: FamilyComponent },
  { path: 'school', component: SchoolComponent },
  { path: 'excellence', component: ExcellenceComponent },
  { path: 'ask', component: AskComponent },
  { path: 'article/:topic', component: ArticleComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];
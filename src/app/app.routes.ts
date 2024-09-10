import { Routes } from '@angular/router';
import {HomeComponent} from "./main-pages/home/home.component";
import {FamilyComponent} from "./main-pages/family/family.component";
import {SchoolComponent} from "./main-pages/school/school.component";
import {ExcellenceComponent} from "./main-pages/excellence/excellence.component";
import {AskComponent} from "./main-pages/ask/ask.component";

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'family', component: FamilyComponent },
  { path: 'school', component: SchoolComponent },
  { path: 'excellence', component: ExcellenceComponent },
  { path: 'ask', component: AskComponent },
  { path: 'article/:topic', component: ArticleComponent },
  { path: 'edit-article/:topic', component: EditArticleComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];

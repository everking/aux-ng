import { Routes } from '@angular/router';
import { HomeComponent } from "./main-pages/home/home.component";
import { ArticleCategoryComponent } from "./main-pages/article-category/article-category.component";
import { AskComponent } from "./main-pages/ask/ask.component";
import { ArticleComponent } from "./components/article/article.component";
import { EditArticleComponent } from "./main-pages/edit-article/edit-article.component";
import { ParameterComponent } from "./main-pages/parameter/parameter.component";
import { LoginComponent } from "./main-pages/login/login.component";

export const routes: Routes = [
  /*
   Note: put static routes first. 
   ':pageId' and '' should be last.
  */
  { path: 'home', component: HomeComponent },
  { path: 'ask', component: AskComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: LoginComponent },
  { path: 'article/:articleId', component: ArticleComponent },
  { path: 'edit-article/:articleId', component: EditArticleComponent },
  { path: ':pageId', component: ArticleCategoryComponent },
  { path: '', component: ParameterComponent }
];

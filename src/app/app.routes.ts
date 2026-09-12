import { Routes } from '@angular/router';
import { HomeComponent } from "./main-pages/home/home.component";
import { ArticleCategoryComponent } from "./main-pages/article-category/article-category.component";
import { ArticleComponent } from "./components/article/article.component";
import { EditArticleComponent } from "./main-pages/edit-article/edit-article.component";
import { ParameterComponent } from "./main-pages/parameter/parameter.component";
import { LoginComponent } from "./main-pages/login/login.component";
import { PrivacyComponent } from "./main-pages/privacy/privacy.component";
import { TermsComponent } from "./main-pages/terms/terms.component";
import { SearchComponent } from "./main-pages/search/search.component";
import { ArticleState } from './interfaces/article';
import { PendingComponent } from './components/pending/pending.component';
import { EventsComponent } from './main-pages/events/events.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { EditEventComponent } from './main-pages/edit-event/edit-event.component';

export const routes: Routes = [
  /*
   Note: put static routes first. 
   ':pageId' and '' should be last.
  */
  { path: 'home', component: HomeComponent },
  { path: 'ask', redirectTo: 'resources', pathMatch: 'full' },
  { path: 'resources', component: ArticleComponent, data: { 
      articleId: 'resources', 
      state: ArticleState.ACTIVE ,
      showSearch: true
    }  
  },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: LoginComponent },
  { path: 'search', component: SearchComponent },
  { path: 'pending', component: PendingComponent },
  { path: 'events', component: EventsComponent },
  { path: 'event/:eventId', component: EventDetailComponent },
  { path: 'edit-event/:eventId', component: EditEventComponent },
  { path: 'article/:articleId', component: ArticleComponent, data: { 
      state: ArticleState.ACTIVE 
    }  
  },
  { path: 'preview/:articleId', component: ArticleComponent, data: { 
      state: ArticleState.PREVIEW 
    } 
  },
  { path: 'edit-article/:articleId', component: EditArticleComponent },
  { path: ':pageId', component: ArticleCategoryComponent },
  { path: '', component: ParameterComponent }
];

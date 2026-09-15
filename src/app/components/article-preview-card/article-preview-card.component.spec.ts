import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ArticlePreviewCardComponent } from './article-preview-card.component';

describe('ArticlePreviewCardComponent', () => {
  let component: ArticlePreviewCardComponent;
  let fixture: ComponentFixture<ArticlePreviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticlePreviewCardComponent],
      providers: [provideRouter([]), provideHttpClient()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ArticlePreviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

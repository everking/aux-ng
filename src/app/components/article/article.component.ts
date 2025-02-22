import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { NgIf } from "@angular/common";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { Article } from "../../interfaces/article";
import { ArticleService } from "../../services/article.service";
import { LoginService } from '../../services/login.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import e from 'express';

@Component({
  selector: 'app-article',
  imports: [
    NgIf,
    MatProgressSpinner,
    RouterModule
  ],
  templateUrl: './article.component.html',
  styleUrl: './article.component.scss'
})
export class ArticleComponent implements OnInit {
  article!: Article | null;
  isLoggedIn: boolean = false;
  editLink: string = '';
  externalLinkCheck: boolean = false;
  private observer!: MutationObserver; 

  ngAfterViewChecked() {
    setTimeout(() => this.updateExternalLinks(), 0);
  }

  private updateExternalLinks() {
    if (this.externalLinkCheck) {
      return;
    }
    console.log(document.body.innerHTML)
    const container: HTMLElement = this.elRef.nativeElement.querySelector('.article');
    if (container) {
      console.log("Container!");
      this.externalLinkCheck = true;
      const links: NodeListOf<HTMLAnchorElement> = container.querySelectorAll("a[href^='http']");
      links.forEach(link => {
        console.log("link.href " + link.href);
        if (!link.href.includes(location.hostname)) { // Ensure it's an external link
          this.renderer.setAttribute(link, "target", "_blank");
          this.renderer.setAttribute(link, "rel", "noopener noreferrer");
        }
      });
    } else {
      console.log("NOT Container!");

    }
  }

  constructor(
    private route: ActivatedRoute,
    private loginService: LoginService,
    private articleService: ArticleService,
    private elRef: ElementRef,
    private renderer: Renderer2) {
  }

  async ngOnInit() {
    this.isLoggedIn = this.loginService.isLoggedIn();
    const articleId: string = this.route.snapshot.paramMap.get('articleId') || '';
    this.editLink = `/edit-article/${articleId}`;
    this.article = await this.articleService.fetchLocalArticle(articleId);
  }
}

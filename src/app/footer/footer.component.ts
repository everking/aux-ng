import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginService } from '../services/login.service';

@Component({
    selector: 'app-footer',
    imports: [ CommonModule, RouterModule ],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {
    currentYear = new Date().getFullYear();

    constructor(private loginService: LoginService) {}

    get isLoggedIn(): boolean {
        return this.loginService.isLoggedIn();
    }
}

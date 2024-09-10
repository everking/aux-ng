import { Component } from '@angular/core';
import {MatGridList, MatGridTile} from "@angular/material/grid-list";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatGridList,
    MatGridTile
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
}

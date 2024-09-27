import { Component } from '@angular/core';
import { MatGridListModule } from "@angular/material/grid-list";

@Component({
  selector: 'app-ask',
  standalone: true,
  imports: [
    MatGridListModule
  ],
  templateUrl: './ask.component.html',
  styleUrl: './ask.component.css'
})
export class AskComponent {

}

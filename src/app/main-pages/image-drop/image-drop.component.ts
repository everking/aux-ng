import { Component, HostListener } from '@angular/core';
import { CommonModule, NgClass, NgForOf, NgIf } from "@angular/common";

@Component({
  selector: 'app-image-drop',
  standalone: true,
  templateUrl: './image-drop.component.html',
  styleUrls: ['./image-drop.component.css'],
  imports: [ NgIf ]
})




export class ImageDropComponent {
  base64Image: string | null = null;

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  @HostListener('drop', ['$event'])
  async onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      const resizedImageBase64 = await this.resizeAndCropImage(file);
      this.base64Image = resizedImageBase64;
    }
  }

  async resizeAndCropImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.src = e.target.result;
        img.onload = () => {
          const MAX_WIDTH = 1080;
          const scaleFactor = MAX_WIDTH / img.width;
          const width = Math.min(img.width, MAX_WIDTH);
          const height = (img.height / img.width) * width

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = 200;
          const ctx = canvas.getContext('2d')!;

          if (height >= canvas.height) {
            const cropStartY = (height - canvas.height) / 2;
            ctx.drawImage(img, 0, cropStartY, width, 600, 0, 0, width, 600);
          } else {
            // If height < 600, center the image vertically and add padding
            const padding = (canvas.height - height) / 2;
            ctx.fillStyle = '#ffffff'; // White background
            ctx.fillRect(0, 0, width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height, 0, padding, width, height);
          }

          if (ctx) {
            const resizedImage = canvas.toDataURL('image/svg+xml');
            resolve(resizedImage);
          } else {
            reject(new Error('Canvas rendering context not available'));
          }
        };
      };
      reader.readAsDataURL(file);
    });
  }
}


import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgIf } from "@angular/common";
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-image-drop',
  templateUrl: './image-drop.component.html',
  styleUrls: ['./image-drop.component.css'],
  imports: [NgIf]
})

export class ImageDropComponent implements OnChanges {
  public base64Image: string | null = null;

  constructor(private articleService: ArticleService) {

  }
  @Input() imageURI?: string = '';
  @Output() imageDropped: EventEmitter<string> = new EventEmitter<string>();

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async getFileFromImageUrl(imageUrl: string): Promise<File> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Convert Blob to File
    const file = new File([blob], 'image.jpg', { type: blob.type });

    return file;
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

  ngOnChanges(changes: SimpleChanges): void {
    // Detect if imageURI has changed
    if (changes['imageURI'] && changes['imageURI'].currentValue) {
      this.base64Image = changes['imageURI'].currentValue;
    }
  }

  async resizeAndCropImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e: any) => {
        img.src = e.target.result;
        img.onload = () => {
          const MAX_WIDTH = 712;
          const MAX_HEIGHT = 406;
          const width = Math.min(img.width, MAX_WIDTH);
          const height = (img.height / img.width) * width

          const canvas = document.createElement('canvas');
          canvas.width = MAX_WIDTH;
          canvas.height = MAX_HEIGHT;
          const ctx = canvas.getContext('2d')!;

          // If height < 600, center the image vertically and add padding
          ctx.fillStyle = '#000000'; // White background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          let sx = 0; // left
          let sy = 0; // top
          if (width < MAX_WIDTH) {
            sx = (MAX_WIDTH - width)/2; // center
          }
          if (height < MAX_HEIGHT) {
            sy = (MAX_HEIGHT - height)/2; // center
          }
          ctx.drawImage(
            img,
            sx, sy,
            width, height // sw, sh
          );

          if (ctx) {
            const resizedImage = canvas.toDataURL('image/svg+xml');
            this.base64Image = resizedImage;
            this.imageDropped.emit(resizedImage);
            resolve(resizedImage);
          } else {
            reject(new Error('Canvas rendering context not available'));
          }
        };
      };
      reader.readAsDataURL(file);
    });
  }
  ngOnInit(): void {
    this.base64Image = this.imageURI || this.articleService.defaultImageURI;
    if (this.base64Image.startsWith("http")) {
      this.getFileFromImageUrl(this.base64Image).then((file)=>{
        this.resizeAndCropImage(file);
      })
    }
  }
}


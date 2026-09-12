import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { FormsModule } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule, UploadResponse } from '@kolkov/angular-editor';
import { ImageDropComponent } from '../image-drop/image-drop.component';
import { LoginService } from '../../services/login.service';
import { Observable, Observer } from 'rxjs';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { BulletinEvent, formatDateRange } from '../../interfaces/bulletin-event';
import { ArticleService } from '../../services/article.service';
import { DateRecurrence, parseDates, parseISODate, toUSDate } from '../../utils/date-parse';
import { TagInputComponent } from '../../components/tag-input/tag-input.component';

@Component({
  selector: 'app-edit-event',
  imports: [
    FormsModule,
    AngularEditorModule,
    ImageDropComponent,
    CommonModule,
    TagInputComponent
  ],
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent implements OnInit {
  eventId = '';
  header = '';
  body = '';
  documentId = '';
  name = '';
  imageURI = '';
  dates = '';
  dateFrom = '';
  dateTo = '';
  schedule = '';
  recurrence: DateRecurrence | null = null;
  tags: string[] = [];
  where = '';
  dateHint = '';
  dateError = '';
  saveMessage = '';
  changed = false;
  isNew = false;
  deleting = false;
  embedImageProps = {
    width: 384,
    height: 216
  };

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private loginService: LoginService,
    private articleService: ArticleService,
    private router: Router
  ) {}

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '15rem',
    minHeight: '5rem',
    placeholder: 'Describe the event...',
    translate: 'no',
    defaultFontName: 'EB Garamond',
    upload: (file: File): Observable<HttpEvent<UploadResponse>> => {
      return new Observable((observer: Observer<HttpEvent<UploadResponse>>) => {
        this.resizeAndCropImage(file, this.embedImageProps.width, this.embedImageProps.height).then((base64Image) => {
          observer.next(new HttpResponse({ body: { imageUrl: base64Image } }));
          observer.complete();
        }).catch((error) => {
          console.error('Error processing image:', error);
          observer.error(error);
        });
      });
    },
    toolbarHiddenButtons: [
      ['fontName']
    ]
  };

  onArticleChange() {
    this.changed = true;
  }

  onFieldChange() {
    this.changed = true;
  }

  onTagsChange(tags: string[]) {
    this.tags = tags;
    this.changed = true;
  }

  onImageDropped(image: string) {
    this.imageURI = image;
    this.changed = true;
  }

  resolveDates() {
    const parsed = parseDates(this.dates);
    if (!parsed) {
      this.dateError = this.dates.trim() ? 'Could not understand that date.' : '';
      this.dateHint = '';
      this.dateFrom = '';
      this.dateTo = '';
      this.schedule = '';
      this.recurrence = null;
      return;
    }
    this.dates = parsed.dates;
    this.dateFrom = parsed.dateFrom;
    this.dateTo = parsed.dateTo;
    this.schedule = parsed.schedule;
    this.recurrence = parsed.recurrence;
    this.dateError = '';
    this.dateHint = parsed.kind === 'recurring'
      ? `Next: ${formatDateRange(parsed.dateFrom, parsed.dateTo)}`
      : '';
    this.changed = true;
  }

  hasChanged() {
    return this.changed && this.isValid();
  }

  isValid(): boolean {
    if (!this.header.trim()) {
      return false;
    }
    if (this.dateFrom && this.dateTo) {
      return this.dateTo >= this.dateFrom;
    }
    return !!parseDates(this.dates);
  }

  onCancelClick() {
    if (this.isNew) {
      this.router.navigate(['/events']);
    } else {
      this.router.navigate([`/event/${this.eventId}`]);
    }
  }

  async onDeleteClick() {
    if (this.isNew || this.deleting) {
      return;
    }
    const confirmed = window.confirm('Delete this event? It will be removed from the Events board.');
    if (!confirmed) {
      return;
    }
    this.deleting = true;
    const deleted = await this.eventService.deleteEvent({
      eventId: this.eventId,
      header: this.header,
      body: this.body,
      imageURI: this.imageURI,
      dates: this.dates,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      schedule: this.schedule,
      recurrence: this.recurrence,
      tags: this.tags,
      where: this.where,
      meta: {
        documentId: this.documentId,
        name: this.name
      }
    });
    if (deleted) {
      await this.router.navigate(['/events']);
      return;
    }
    this.deleting = false;
    this.saveMessage = 'Sorry. Not deleted.';
  }

  async onSaveClick() {
    this.resolveDates();
    if (!this.isValid()) {
      this.saveMessage = 'Please add a title and a valid date.';
      return;
    }

    const event: BulletinEvent = {
      eventId: this.eventId,
      header: this.header || '',
      imageURI: this.imageURI || this.eventService.defaultImageURI,
      body: this.body || '',
      dates: this.dates,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      schedule: this.schedule,
      recurrence: this.recurrence,
      tags: this.tags,
      where: this.where,
      meta: {
        documentId: this.documentId,
        name: this.name,
        createdBy: this.loginService.getFirebaseLogin()?.email || ''
      }
    };
    const isSaved = await this.eventService.saveEvent(event);
    if (isSaved) {
      this.saveMessage = 'Saved!';
      this.changed = false;
      this.router.navigate([`/event/${this.eventId}`]);
    } else {
      this.saveMessage = 'Sorry. Not saved!';
    }
  }

  ngOnInit(): void {
    this.articleService.setCurrentCategory('');
    const routeId = this.route.snapshot.paramMap.get('eventId') || 'new';
    this.isNew = routeId === 'new';
    this.eventId = this.isNew ? crypto.randomUUID() : routeId;

    if (!this.loginService.getIdToken()) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/edit-event/${routeId}` } });
      return;
    }

    if (this.isNew) {
      this.documentId = this.eventService.NEW_LABEL;
      this.name = this.eventService.NEW_LABEL;
      this.imageURI = this.eventService.defaultImageURI;
      this.changed = false;
      return;
    }

    this.eventService.fetchEvent(this.eventId).then((event) => {
      if (!event) {
        this.documentId = this.eventService.NEW_LABEL;
        this.name = this.eventService.NEW_LABEL;
        this.imageURI = this.eventService.defaultImageURI;
        this.changed = false;
        return;
      }
      this.body = event.body;
      this.header = event.header;
      this.imageURI = event.imageURI || '';
      this.dates = event.dates || this.fallbackDates(event.dateFrom, event.dateTo);
      this.dateFrom = event.dateFrom;
      this.dateTo = event.dateTo;
      this.schedule = event.schedule;
      this.recurrence = event.recurrence;
      this.tags = event.tags || [];
      this.where = event.where || '';
      this.dateHint = event.recurrence
        ? `Next: ${formatDateRange(event.dateFrom, event.dateTo)}`
        : '';
      this.documentId = event.meta?.documentId || this.eventService.NEW_LABEL;
      this.name = event.meta?.name || this.eventService.NEW_LABEL;
      this.changed = false;
    });
  }

  private fallbackDates(dateFrom: string, dateTo: string): string {
    const from = parseISODate(dateFrom);
    const to = parseISODate(dateTo || dateFrom);
    if (!from) {
      return '';
    }
    if (!to || toUSDate(from) === toUSDate(to)) {
      return toUSDate(from);
    }
    return `${toUSDate(from)} – ${toUSDate(to)}`;
  }

  async resizeAndCropImage(file: File, width: number, height: number): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const resizedHeight = Math.round(width / aspectRatio);

          const finalHeight = height === 0 ? resizedHeight : height;
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          canvas.width = width;
          canvas.height = finalHeight;

          if (height === 0) {
            ctx.drawImage(img, 0, 0, width, resizedHeight);
          } else {
            const cropY = Math.max(0, (resizedHeight - height) / 2);
            ctx.drawImage(img, 0, -cropY, width, resizedHeight);
          }

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
      reader.readAsDataURL(file);
    });
  }
}

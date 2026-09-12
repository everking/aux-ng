import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BulletinEvent, hydrateEvent, parseRecurrenceJson } from '../interfaces/bulletin-event';
import { LoginService } from './login.service';
import { ArticleService } from './article.service';
import { readFirestoreStringArray, toFirestoreStringArray } from '../utils';

interface FirestoreValue {
  stringValue?: string;
  timestampValue?: string;
  arrayValue?: {
    values?: FirestoreValue[];
  };
  mapValue?: {
    fields?: {
      lastUpdated?: FirestoreValue;
      createdBy?: FirestoreValue;
      category?: FirestoreValue;
      subCategory?: FirestoreValue;
      tags?: FirestoreValue;
    };
  };
}

interface FirestoreDocument {
  name?: string;
  fields?: {
    header?: FirestoreValue;
    body?: FirestoreValue;
    imageURI?: FirestoreValue;
    dates?: FirestoreValue;
    dateFrom?: FirestoreValue;
    dateTo?: FirestoreValue;
    schedule?: FirestoreValue;
    recurrence?: FirestoreValue;
    where?: FirestoreValue;
    eventId?: FirestoreValue;
    articleId?: FirestoreValue;
    meta?: FirestoreValue;
  };
}

interface FirestoreQueryResult {
  document?: FirestoreDocument;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  public readonly defaultImageURI = '/assets/images/default-image.png';
  public readonly NEW_LABEL = '[ new ]';
  public readonly BASE_FIRESTORE = 'https://firestore.googleapis.com/v1';
  public readonly EVENTS_CATEGORY = 'events';
  private readonly PROJECT_PATH = 'projects/auxilium-420904/databases/aux-db';
  private baseHref: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private loginService: LoginService,
    private articleService: ArticleService
  ) {
    const baseElement = this.document.querySelector('base');
    this.baseHref = (baseElement ? baseElement.getAttribute('href') : '/')!;
  }

  private getHeaders() {
    const header: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.loginService.getIdToken()) {
      header['Authorization'] = `Bearer ${this.loginService.getIdToken()}`;
    }
    return header;
  }

  public firebaseToEvent(document: FirestoreDocument): BulletinEvent {
    const fields = document?.fields;
    const name = document?.name;
    const pattern = /[^/]+$/;
    const match = name?.match(pattern);
    let documentId = '';
    if (match) {
      documentId = match[0];
    }

    const recurrence = parseRecurrenceJson(fields?.recurrence?.stringValue);
    const dateFrom = fields?.dateFrom?.stringValue || '';
    const dateTo = fields?.dateTo?.stringValue || dateFrom;
    return hydrateEvent({
      header: fields?.header?.stringValue?.toString() || '',
      body: fields?.body?.stringValue?.toString() || '',
      imageURI: fields?.imageURI?.stringValue || this.defaultImageURI,
      dates: fields?.dates?.stringValue || '',
      dateFrom,
      dateTo,
      schedule: fields?.schedule?.stringValue || '',
      recurrence,
      tags: readFirestoreStringArray(fields?.meta?.mapValue?.fields?.tags),
      where: fields?.where?.stringValue || '',
      meta: {
        name: document?.name?.toString(),
        lastUpdated: fields?.meta?.mapValue?.fields?.lastUpdated?.timestampValue || '',
        createdBy: fields?.meta?.mapValue?.fields?.createdBy?.stringValue || '',
        documentId
      },
      eventId: fields?.eventId?.stringValue || fields?.articleId?.stringValue || crypto.randomUUID()
    });
  }

  public async fetchEvents(): Promise<BulletinEvent[]> {
    const published = await this.fetchPublishedEvents();
    const byId = new Map(published.map((event) => [event.eventId, event]));

    if (this.loginService.isLoggedIn()) {
      const live = await this.fetchFirestoreEvents();
      live.forEach((event) => byId.set(event.eventId, event));
    }

    return Array.from(byId.values());
  }

  public async fetchPublishedEvents(): Promise<BulletinEvent[]> {
    await this.articleService.loadCategories();
    const eventIds = this.articleService.getCategory(this.EVENTS_CATEGORY)?.articles || [];
    const events: BulletinEvent[] = [];

    for (const eventId of eventIds) {
      const event = await this.loadJsonEvent(eventId);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  public async fetchFirestoreEvents(): Promise<BulletinEvent[]> {
    try {
      const response = await fetch(
        `${this.BASE_FIRESTORE}/${this.PROJECT_PATH}/documents:runQuery`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'articles' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'meta.category' },
                  op: 'EQUAL',
                  value: { stringValue: this.EVENTS_CATEGORY }
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return [];
      }

      const documents: FirestoreQueryResult[] = await response.json();
      const events: BulletinEvent[] = [];
      documents.forEach((entry) => {
        if (entry.document) {
          events.push(this.firebaseToEvent(entry.document));
        }
      });
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  public async fetchEvent(eventId: string): Promise<BulletinEvent | null> {
    if (this.loginService.isLoggedIn()) {
      const live = await this.fetchFromFirestore(eventId);
      if (live) {
        return live;
      }
    }
    return this.loadJsonEvent(eventId);
  }

  public async loadJsonEvent(eventId: string): Promise<BulletinEvent | null> {
    try {
      const url = `${this.baseHref}assets/data/articles/${eventId}.json`;
      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        return null;
      }
      const document = await response.json();
      if (!document?.document) {
        return null;
      }
      const event = this.firebaseToEvent(document.document);
      if (!event.dateFrom && !event.dateTo) {
        return null;
      }
      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  public async fetchFromFirestore(eventId: string): Promise<BulletinEvent | null> {
    try {
      const response = await fetch(
        `${this.BASE_FIRESTORE}/${this.PROJECT_PATH}/documents:runQuery`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'articles' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'articleId' },
                  op: 'EQUAL',
                  value: { stringValue: eventId }
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        return null;
      }

      const documents: FirestoreQueryResult[] = await response.json();
      if (!documents || !documents[0]?.document) {
        return null;
      }
      const event = this.firebaseToEvent(documents[0].document);
      if (!event.dateFrom && !event.dateTo) {
        return null;
      }
      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      return null;
    }
  }

  saveEvent = async (event: BulletinEvent): Promise<boolean> => {
    try {
      const documentId = event.meta?.documentId;
      const { body, header, imageURI, meta, dateFrom, dateTo, dates, schedule, recurrence, tags, where } = event;
      const documentName = event.meta?.name;
      const createdBy = meta?.createdBy || this.loginService.getFirebaseLogin()?.email || '';

      const fieldPaths = ['body', 'header', 'imageURI', 'dates', 'dateFrom', 'dateTo', 'schedule', 'recurrence', 'where', 'meta'];
      const updateMask = fieldPaths.map((field) => `updateMask.fieldPaths=${field}`).join('&');
      const newEventUrl = `${this.BASE_FIRESTORE}/${this.PROJECT_PATH}/documents/articles`;
      const firestorePath =
        documentId === this.NEW_LABEL ? newEventUrl : `${this.BASE_FIRESTORE}/${documentName}?${updateMask}`;
      const method = documentId === this.NEW_LABEL ? 'POST' : 'PATCH';

      const lastUpdated = new Date().toISOString();
      const response = await fetch(firestorePath, {
        method,
        headers: this.getHeaders(),
        body: JSON.stringify({
          fields: {
            articleId: {
              stringValue: event.eventId
            },
            eventId: {
              stringValue: event.eventId
            },
            body: {
              stringValue: body || ''
            },
            header: {
              stringValue: header || ''
            },
            imageURI: {
              stringValue: imageURI || ''
            },
            dates: {
              stringValue: dates || ''
            },
            dateFrom: {
              stringValue: dateFrom || ''
            },
            dateTo: {
              stringValue: dateTo || ''
            },
            schedule: {
              stringValue: schedule || ''
            },
            recurrence: {
              stringValue: recurrence ? JSON.stringify(recurrence) : ''
            },
            where: {
              stringValue: where || ''
            },
            meta: {
              mapValue: {
                fields: {
                  category: {
                    stringValue: this.EVENTS_CATEGORY
                  },
                  subCategory: {
                    stringValue: 'default'
                  },
                  lastUpdated: {
                    timestampValue: lastUpdated
                  },
                  createdBy: {
                    stringValue: createdBy
                  },
                  tags: toFirestoreStringArray(tags || [])
                }
              }
            }
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving event:', error);
      return false;
    }
  };
}

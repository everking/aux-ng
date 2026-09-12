# Technical Details

## Article Editing

- **`src/app/main-pages/edit-article/edit-article.component.ts:27-39`** — Component state with reactive form (header, category, subCategory) and AngularEditor for rich text body with image upload support.
- **`src/app/main-pages/edit-article/edit-article.component.ts:110-135`** — `onSaveClick()` builds Article object and calls `articleService.saveArticle()` for Firestore CRUD (POST for new, PATCH for updates).
- **`src/app/main-pages/edit-article/edit-article.component.ts:163-196`** — `resizeAndCropImage()` resizes cover images to base64 (480x270) with vertical centering; also used for inline body images via `insertImage()`.
- **`src/app/main-pages/image-drop/image-drop.component.ts:36-44`** — Drag-drop handler that converts dropped files to base64 and resizes to 480x270 before emitting to parent.
- **`src/app/services/article.service.ts:271-330`** — `saveArticle()` performs Firestore REST API calls (POST to collection for new articles, PATCH to document for updates) with `lastUpdated` timestamp set to `toISOString()`.
- **No content validation** — Only UI enablement via FormControl `dirty` state; no required field validators or content length checks.

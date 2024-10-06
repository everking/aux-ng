export interface ArticleMeta {
  /*
    documentId and name are firestore
    implementation specific
  */
  documentId?: string;
  name?: string;
  category?: string;
  subCategory?: string;
  tags?: string [];
  created?: Date;
  modified?: Date;
}

export interface Article {
  articleId: string; /* article route key */
  imageURI: string; /* image base64 or URL */
  header: string; /* title */
  body: string; /* HTML body */
  meta?: ArticleMeta
}

export const INVALID_ARTICLE: Article = {
  articleId: 'article-does-not-exist',
  imageURI: 'article-does-not-exist',
  header: 'article-does-not-exist',
  body: 'article-does-not-exist'
}

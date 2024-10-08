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
  articleId: 'INVALID_ARTICLE',
  imageURI: 'INVALID_ARTICLE',
  header: 'INVALID_ARTICLE',
  body: 'INVALID_ARTICLE',
  meta: {
    documentId: 'INVALID_ARTICLE',
    name: 'INVALID_ARTICLE',
    category: 'INVALID_ARTICLE',
    subCategory: 'INVALID_ARTICLE'
  }
}

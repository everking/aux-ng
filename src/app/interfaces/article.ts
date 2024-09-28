export interface ArticleMeta {
  documentId?: string;
  name?: string;
  category?: string;
  subCategory?: string;
  tags?: string [];
  created?: Date;
  modified?: Date;
}

export interface Article {
  articleId: string;
  imageURI?: string;
  header?: string;
  body?: string;
  meta?: ArticleMeta
}

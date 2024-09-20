export type SubCategory = 'Politics' | 'Spiritual' | 'Article';

export interface Article {
  subCategory: SubCategory;
  imageLocation: string;
  headerText: string;
  descriptionText: string;
}

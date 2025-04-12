export interface SubCategory {
  key: string;
  name: string;
  summary: string;
  articles: string[];
}

export interface Category {
  key: string;
  name: string;
  summary: string;
  articles?: string[];
  subCategories?: SubCategory[];
}

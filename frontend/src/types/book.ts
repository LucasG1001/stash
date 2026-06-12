export interface BookCard {
  id: string;
  title: string;
  coverImage: string | null;
  authors: string[];
  publishedDate: string | null;
  averageRating: number | null;
  ratingsCount: number | null;
}

export interface BookDetail extends BookCard {
  subtitle: string | null;
  description: string | null;
  publisher: string | null;
  pageCount: number | null;
  categories: string[];
  language: string | null;
  isbn: string | null;
}

export interface PageInfo {
  total: number;
  currentPage: number;
  hasNextPage: boolean;
}

export interface BookListResponse {
  books: BookCard[];
  pageInfo: PageInfo;
}

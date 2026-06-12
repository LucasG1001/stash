export interface GoogleBooksImageLinks {
  smallThumbnail?: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
}

export interface GoogleBooksIndustryIdentifier {
  type: string;
  identifier: string;
}

export interface GoogleBooksVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: GoogleBooksImageLinks;
  language?: string;
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

export interface GoogleBooksListResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

export interface BookPageInfo {
  total: number;
  currentPage: number;
  hasNextPage: boolean;
}

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

export interface BookListResult {
  books: BookCard[];
  pageInfo: BookPageInfo;
}

import axios from "axios";
import type {
  GoogleBooksVolume,
  GoogleBooksListResponse,
  BookCard,
  BookDetail,
  BookListResult,
  BookPageInfo,
} from "../types/book.js";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";
const PAGE_SIZE = 20;

function proxify(url: string | null): string | null {
  return url ? `/api/book/media?url=${encodeURIComponent(url)}` : null;
}

function coverFrom(volume: GoogleBooksVolume): string | null {
  const links = volume.volumeInfo.imageLinks;
  if (!links) return null;
  const raw = links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || null;
  if (!raw) return null;
  let url = raw.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
  if (url.includes("/books/content?")) {
    url = url.replace(/([?&])zoom=\d+/, "$1zoom=2");
  }
  return proxify(url);
}

function isbnFrom(volume: GoogleBooksVolume): string | null {
  const ids = volume.volumeInfo.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13");
  const isbn10 = ids.find((i) => i.type === "ISBN_10");
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

function toBookCard(volume: GoogleBooksVolume): BookCard {
  const info = volume.volumeInfo;
  return {
    id: volume.id,
    title: info.title || "Sem título",
    coverImage: coverFrom(volume),
    authors: info.authors ?? [],
    publishedDate: info.publishedDate || null,
    averageRating: info.averageRating ?? null,
    ratingsCount: info.ratingsCount ?? null,
  };
}

function toBookDetail(volume: GoogleBooksVolume): BookDetail {
  const info = volume.volumeInfo;
  return {
    ...toBookCard(volume),
    subtitle: info.subtitle || null,
    description: info.description || null,
    publisher: info.publisher || null,
    pageCount: info.pageCount ?? null,
    categories: info.categories ?? [],
    language: info.language || null,
    isbn: isbnFrom(volume),
  };
}

function toPageInfo(data: GoogleBooksListResponse, page: number, count: number): BookPageInfo {
  const total = data.totalItems ?? 0;
  return {
    total,
    currentPage: page,
    hasNextPage: page * PAGE_SIZE < total && count === PAGE_SIZE,
  };
}

async function queryGoogleBooks<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const response = await axios.get<T>(`${GOOGLE_BOOKS_URL}${path}`, {
    params: { country: "BR", ...(key ? { key } : {}), ...params },
  });
  return response.data;
}

export async function fetchBooksByGenre(subject: string, page = 1): Promise<BookListResult> {
  const data = await queryGoogleBooks<GoogleBooksListResponse>("/volumes", {
    q: `subject:"${subject}"`,
    orderBy: "relevance",
    startIndex: (page - 1) * PAGE_SIZE,
    maxResults: PAGE_SIZE,
  });
  const items = data.items ?? [];
  return { books: items.map(toBookCard), pageInfo: toPageInfo(data, page, items.length) };
}

export async function searchBooks(searchQuery: string, page = 1): Promise<BookListResult> {
  const data = await queryGoogleBooks<GoogleBooksListResponse>("/volumes", {
    q: `intitle:${searchQuery}`,
    startIndex: (page - 1) * PAGE_SIZE,
    maxResults: PAGE_SIZE,
  });
  const items = data.items ?? [];
  return { books: items.map(toBookCard), pageInfo: toPageInfo(data, page, items.length) };
}

export async function fetchBookById(id: string): Promise<BookDetail> {
  const volume = await queryGoogleBooks<GoogleBooksVolume>(`/volumes/${id}`);
  return toBookDetail(volume);
}

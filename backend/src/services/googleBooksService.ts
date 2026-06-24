import { cachedRequest } from "../lib/httpClient.js";
import type {
  GoogleBooksVolume,
  GoogleBooksListResponse,
  BookCard,
  BookDetail,
  BookListResult,
  BookPageInfo,
} from "../types/book.js";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1";
const PAGE_SIZE = 40;
const CACHE_TTL_MS = 60 * 60 * 1000;

const JUNK_PATTERNS = [
  /\bsummary\b/i,
  /\bsummaries\b/i,
  /\bstudy guide\b/i,
  /\bstudyguide\b/i,
  /\bworkbook\b/i,
  /\banalysis\b/i,
  /\bcompanion\b/i,
  /\bquiz\b/i,
  /\btrivia\b/i,
  /\bspark ?notes?\b/i,
  /\bcliffs? ?notes?\b/i,
  /\bboxed? set\b/i,
  /\bcollector'?s edition set\b/i,
  /\bguide to\b/i,
  /\bnotes on\b/i,
  /\bunofficial\b/i,
  /\bconversation starters\b/i,
];

function coverFrom(volume: GoogleBooksVolume): string | null {
  const links = volume.volumeInfo.imageLinks;
  if (!links) return null;
  const raw = links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || null;
  if (!raw) return null;
  let url = raw.replace(/^http:/, "https:").replace(/&edge=curl/g, "");
  if (url.includes("/books/content?")) {
    url = url.replace(/([?&])zoom=\d+/, "$1zoom=2");
  }
  return url;
}

function isbnFrom(volume: GoogleBooksVolume): string | null {
  const ids = volume.volumeInfo.industryIdentifiers ?? [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13");
  const isbn10 = ids.find((i) => i.type === "ISBN_10");
  return isbn13?.identifier ?? isbn10?.identifier ?? null;
}

const ALLOWED_LANGS = new Set(["en", "pt"]);

function isAllowedLanguage(language: string | undefined): boolean {
  if (!language) return true;
  return ALLOWED_LANGS.has(language.split("-")[0].toLowerCase());
}

function isJunk(volume: GoogleBooksVolume): boolean {
  const info = volume.volumeInfo;
  const text = `${info.title || ""} ${info.subtitle || ""}`;
  return JUNK_PATTERNS.some((re) => re.test(text));
}

function isQualityVolume(volume: GoogleBooksVolume): boolean {
  const info = volume.volumeInfo;
  if (!isAllowedLanguage(info.language)) return false;
  if (!info.authors || info.authors.length === 0) return false;
  if (!coverFrom(volume)) return false;
  if (isJunk(volume)) return false;
  return true;
}

function dedupeKey(volume: GoogleBooksVolume): string {
  const info = volume.volumeInfo;
  const title = (info.title || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const author = (info.authors?.[0] || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${title}|${author}`;
}

function cleanVolumes(items: GoogleBooksVolume[]): GoogleBooksVolume[] {
  const seen = new Set<string>();
  const result: GoogleBooksVolume[] = [];
  for (const volume of items) {
    if (!isQualityVolume(volume)) continue;
    const key = dedupeKey(volume);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(volume);
  }
  return result;
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

function toPageInfo(data: GoogleBooksListResponse, page: number, rawCount: number): BookPageInfo {
  const total = data.totalItems ?? 0;
  return {
    total,
    currentPage: page,
    hasNextPage: page * PAGE_SIZE < total && rawCount === PAGE_SIZE,
  };
}

async function queryGoogleBooks<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  return cachedRequest<T>(
    {
      url: `${GOOGLE_BOOKS_URL}${path}`,
      params: { country: "BR", printType: "books", ...(key ? { key } : {}), ...params },
    },
    CACHE_TTL_MS
  );
}

export async function fetchBooksByGenre(subject: string, page = 1): Promise<BookListResult> {
  const data = await queryGoogleBooks<GoogleBooksListResponse>("/volumes", {
    q: `subject:"${subject}"`,
    orderBy: "relevance",
    startIndex: (page - 1) * PAGE_SIZE,
    maxResults: PAGE_SIZE,
  });
  const items = data.items ?? [];
  return { books: cleanVolumes(items).map(toBookCard), pageInfo: toPageInfo(data, page, items.length) };
}

export async function searchBooks(searchQuery: string, page = 1): Promise<BookListResult> {
  const data = await queryGoogleBooks<GoogleBooksListResponse>("/volumes", {
    q: `intitle:${searchQuery}`,
    startIndex: (page - 1) * PAGE_SIZE,
    maxResults: PAGE_SIZE,
  });
  const items = data.items ?? [];
  return { books: cleanVolumes(items).map(toBookCard), pageInfo: toPageInfo(data, page, items.length) };
}

export async function discoverBooksByAuthor(author: string): Promise<BookCard[]> {
  const data = await queryGoogleBooks<GoogleBooksListResponse>("/volumes", {
    q: `inauthor:"${author}"`,
    orderBy: "relevance",
    startIndex: 0,
    maxResults: PAGE_SIZE,
  });
  return cleanVolumes(data.items ?? []).map(toBookCard);
}

export async function fetchBookById(id: string): Promise<BookDetail> {
  const volume = await queryGoogleBooks<GoogleBooksVolume>(`/volumes/${id}`);
  return toBookDetail(volume);
}

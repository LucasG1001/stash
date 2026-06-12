import { api } from "./api";
import type { BookListResponse, BookDetail } from "../types/book";

export async function fetchByGenre(genre: string, page = 1): Promise<BookListResponse> {
  const response = await api.get<BookListResponse>("/api/book/genre", { params: { genre, page } });
  return response.data;
}

export async function searchBooks(query: string, page = 1): Promise<BookListResponse> {
  const response = await api.get<BookListResponse>("/api/book/search", { params: { q: query, page } });
  return response.data;
}

export async function fetchBookById(id: string): Promise<BookDetail> {
  const response = await api.get<BookDetail>(`/api/book/${id}`);
  return response.data;
}

import { api } from "./api";
import type { SeriesLibraryEntry, CreateSeriesLibraryEntry, UpdateSeriesLibraryEntry } from "../types/seriesLibrary";

export async function fetchLibrary(): Promise<SeriesLibraryEntry[]> {
  const response = await api.get<SeriesLibraryEntry[]>("/api/series-library");
  return response.data;
}

export async function addToLibrary(entry: CreateSeriesLibraryEntry): Promise<SeriesLibraryEntry> {
  const response = await api.post<SeriesLibraryEntry>("/api/series-library", entry);
  return response.data;
}

export async function updateLibraryEntry(id: string, data: UpdateSeriesLibraryEntry): Promise<SeriesLibraryEntry> {
  const response = await api.put<SeriesLibraryEntry>(`/api/series-library/${id}`, data);
  return response.data;
}

export async function removeFromLibrary(id: string): Promise<void> {
  await api.delete(`/api/series-library/${id}`);
}

export async function removeManyFromLibrary(ids: string[]): Promise<void> {
  await api.post("/api/series-library/bulk-delete", { ids });
}

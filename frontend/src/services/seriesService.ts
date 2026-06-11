import { api } from "./api";
import type { SeriesListResponse, SeriesDetail } from "../types/series";

export async function fetchPopular(month?: number, year?: number, page = 1): Promise<SeriesListResponse> {
  const params: Record<string, number> = { page };
  if (month) params.month = month;
  if (year) params.year = year;
  const response = await api.get<SeriesListResponse>("/api/series/popular", { params });
  return response.data;
}

export async function searchSeries(query: string, page = 1): Promise<SeriesListResponse> {
  const response = await api.get<SeriesListResponse>("/api/series/search", { params: { q: query, page } });
  return response.data;
}

export async function fetchSeriesById(id: number): Promise<SeriesDetail> {
  const response = await api.get<SeriesDetail>(`/api/series/${id}`);
  return response.data;
}

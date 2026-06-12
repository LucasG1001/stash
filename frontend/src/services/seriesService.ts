import { api } from "./api";
import type { SeriesListResponse, SeriesDetail } from "../types/series";

export async function fetchPopular(year?: number, month?: number, page = 1): Promise<SeriesListResponse> {
  const params: Record<string, number> = { page };
  if (year) params.year = year;
  if (month) params.month = month;
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

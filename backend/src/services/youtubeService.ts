import { cachedRequest } from "../lib/httpClient.js";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos";
const CACHE_TTL_MS = 60 * 60 * 1000;

export type YoutubeServiceErrorCode = "missing_key" | "invalid_url" | "not_found";

export class YoutubeServiceError extends Error {
  code: YoutubeServiceErrorCode;
  constructor(code: YoutubeServiceErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "YoutubeServiceError";
  }
}

export interface YoutubeVideoData {
  videoId: string;
  title: string;
  channelTitle: string | null;
  thumbnail: string | null;
  durationSeconds: number;
  viewCount: number;
  publishedAt: string | null;
  description: string | null;
}

interface YoutubeApiThumbnail {
  url: string;
}

interface YoutubeApiItem {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: Record<string, YoutubeApiThumbnail | undefined>;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
}

interface YoutubeApiResponse {
  items?: YoutubeApiItem[];
}

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function extractVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (ID_PATTERN.test(value)) return value;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseIso8601Duration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function pickThumbnail(thumbnails: Record<string, YoutubeApiThumbnail | undefined> | undefined): string | null {
  if (!thumbnails) return null;
  const preferred = ["maxres", "standard", "high", "medium", "default"];
  for (const key of preferred) {
    const thumb = thumbnails[key];
    if (thumb?.url) return thumb.url;
  }
  return null;
}

export async function fetchVideo(videoId: string): Promise<YoutubeVideoData> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new YoutubeServiceError("missing_key", "YOUTUBE_API_KEY não configurada.");
  }

  const data = await cachedRequest<YoutubeApiResponse>(
    {
      url: YOUTUBE_API_URL,
      method: "get",
      params: { id: videoId, part: "snippet,contentDetails,statistics", key },
    },
    CACHE_TTL_MS
  );

  const item = data.items?.[0];
  if (!item) {
    throw new YoutubeServiceError("not_found", "Vídeo não encontrado no YouTube.");
  }

  return {
    videoId: item.id,
    title: item.snippet?.title ?? "Vídeo sem título",
    channelTitle: item.snippet?.channelTitle ?? null,
    thumbnail: pickThumbnail(item.snippet?.thumbnails),
    durationSeconds: parseIso8601Duration(item.contentDetails?.duration),
    viewCount: item.statistics?.viewCount ? Number(item.statistics.viewCount) : 0,
    publishedAt: item.snippet?.publishedAt ?? null,
    description: item.snippet?.description ?? null,
  };
}

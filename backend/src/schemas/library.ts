import { z } from "zod";

const score = z.number().min(0).max(10).optional();
const nullableString = z.string().nullish();
const nullableNumber = z.number().nullish();

export const movieCreateSchema = z.object({
  tmdbId: z.number(),
  title: z.string().min(1),
  posterImage: nullableString,
  status: z.enum(["plan_to_watch", "watched", "dropped"]).optional(),
  score,
  releaseDate: nullableString,
  runtime: nullableNumber,
  movieStatus: z.string().optional(),
});
export const movieUpdateSchema = movieCreateSchema.partial();

export const seriesCreateSchema = z.object({
  tmdbId: z.number(),
  title: z.string().min(1),
  posterImage: nullableString,
  status: z.enum(["plan_to_watch", "watching", "watched", "dropped"]).optional(),
  score,
  firstAirDate: nullableString,
  seasons: nullableNumber,
  episodes: nullableNumber,
  seriesStatus: z.string().optional(),
});
export const seriesUpdateSchema = seriesCreateSchema.partial();

export const gameCreateSchema = z.object({
  igdbId: z.number(),
  title: z.string().min(1),
  backgroundImage: nullableString,
  status: z.enum(["plan_to_play", "playing", "beaten", "dropped"]).optional(),
  score,
  released: nullableString,
  metacritic: nullableNumber,
  gameStatus: z.string().optional(),
});
export const gameUpdateSchema = gameCreateSchema.partial();

export const bookCreateSchema = z.object({
  googleBooksId: z.string().min(1),
  title: z.string().min(1),
  coverImage: nullableString,
  authors: nullableString,
  status: z.enum(["plan_to_read", "reading", "read", "dropped"]).optional(),
  score,
  publishedDate: nullableString,
  pageCount: nullableNumber,
});
export const bookUpdateSchema = bookCreateSchema.partial();

export const animeCreateSchema = z.object({
  anilistId: z.number(),
  title: z.string().min(1),
  coverImage: nullableString,
  status: z.enum(["plan_to_watch", "watching", "watched", "dropped"]).optional(),
  score,
  totalEpisodes: nullableNumber,
  animeStatus: z.string().optional(),
  nextAiringEpisode: z.unknown().nullish(),
  streamingLinks: z.array(z.unknown()).optional(),
});
export const animeUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  coverImage: nullableString,
  status: z.enum(["plan_to_watch", "watching", "watched", "dropped"]).optional(),
  score,
  totalEpisodes: nullableNumber,
  animeStatus: z.string().optional(),
});

import * as libraryModel from "../models/libraryModel.js";
import { movieLibraryModel, bulkUpsertMovies } from "../models/movieLibraryModel.js";
import { gameLibraryModel, bulkUpsertGames } from "../models/gameLibraryModel.js";
import { discoverFranchise } from "./anilistService.js";
import { discoverCollection } from "./tmdbService.js";
import { discoverGameCollection } from "./igdbService.js";
import { notifyNewCollectionItem, notifyError } from "./notifyService.js";
import type { AnimeCard } from "../types/anime.js";
import type { MovieCard } from "../types/movie.js";
import type { GameCard } from "../types/game.js";
import type { LibraryEntry, CreateLibraryEntry } from "../types/library.js";
import type { MovieLibraryEntry, CreateMovieLibraryEntry } from "../types/movieLibrary.js";
import type { GameLibraryEntry, CreateGameLibraryEntry } from "../types/gameLibrary.js";

function igdbAbsoluteImage(proxyPath: string | null): string | undefined {
  if (!proxyPath) return undefined;
  return proxyPath.replace(/^\/api\/game\/image/, "https://images.igdb.com/igdb/image/upload");
}

interface CollectionSyncAdapter<E, C, Cr> {
  label: string;
  findAll(): Promise<E[]>;
  externalId(entry: E): number;
  collectionKey(entry: E): number | null;
  isCompleted(entry: E): boolean;
  discover(seedId: number): Promise<{ collectionId: number; members: C[] } | null>;
  memberId(member: C): number;
  toCreateEntry(member: C): Cr;
  bulkUpsert(entries: Cr[], collectionId: number): Promise<unknown>;
  notify(member: C, collectionId: number): Promise<void>;
}

async function syncOne<E, C, Cr>(adapter: CollectionSyncAdapter<E, C, Cr>): Promise<number> {
  const entries = await adapter.findAll();
  const existingIds = new Set(entries.map((entry) => adapter.externalId(entry)));

  const completedKeys = new Set<number>();
  for (const entry of entries) {
    const key = adapter.collectionKey(entry);
    if (key != null && adapter.isCompleted(entry)) completedKeys.add(key);
  }

  const seeds = new Set<number>();
  const seededKeys = new Set<number>();
  for (const entry of entries) {
    const key = adapter.collectionKey(entry);
    if (key != null) {
      if (completedKeys.has(key) && !seededKeys.has(key)) {
        seededKeys.add(key);
        seeds.add(adapter.externalId(entry));
      }
    } else if (adapter.isCompleted(entry)) {
      seeds.add(adapter.externalId(entry));
    }
  }

  let added = 0;
  for (const seed of seeds) {
    try {
      const result = await adapter.discover(seed);
      if (!result) continue;

      const novos = result.members.filter((member) => !existingIds.has(adapter.memberId(member)));
      if (novos.length === 0) continue;

      await adapter.bulkUpsert(
        result.members.map((member) => adapter.toCreateEntry(member)),
        result.collectionId
      );

      for (const member of novos) {
        existingIds.add(adapter.memberId(member));
        await adapter.notify(member, result.collectionId);
        added++;
      }
    } catch (error) {
      await notifyError("collectionSyncService.syncOne", error, { mediaType: adapter.label, seed: String(seed) });
    }
  }

  if (added > 0) console.log(`Sync de coleções (${adapter.label}): ${added} novo(s) item(ns) adicionado(s).`);
  return added;
}

const animeAdapter: CollectionSyncAdapter<LibraryEntry, AnimeCard, CreateLibraryEntry> = {
  label: "anime",
  findAll: () => libraryModel.findAll(),
  externalId: (entry) => entry.anilistId,
  collectionKey: (entry) => entry.franchiseId,
  isCompleted: (entry) => entry.status === "watched",
  discover: async (seedId) => {
    const members = await discoverFranchise(seedId);
    if (members.length < 2) return null;
    return { collectionId: Math.min(...members.map((m) => m.id)), members };
  },
  memberId: (member) => member.id,
  toCreateEntry: (member) => ({
    anilistId: member.id,
    title: member.title,
    coverImage: member.coverImage,
    status: "plan_to_watch",
    score: 0,
    totalEpisodes: member.episodes,
    animeStatus: member.status,
    format: member.format,
    seasonYear: member.seasonYear,
    nextAiringEpisode: member.nextAiringEpisode,
    streamingLinks: member.streamingLinks,
  }),
  bulkUpsert: (entries, collectionId) => libraryModel.bulkUpsert(entries, collectionId),
  notify: (member) =>
    notifyNewCollectionItem({
      mediaType: "anime",
      title: member.title,
      image: member.coverImage ?? undefined,
      url: `https://anilist.co/anime/${member.id}`,
    }),
};

const movieAdapter: CollectionSyncAdapter<MovieLibraryEntry, MovieCard, CreateMovieLibraryEntry> = {
  label: "filme",
  findAll: () => movieLibraryModel.findAll(),
  externalId: (entry) => entry.tmdbId,
  collectionKey: (entry) => entry.collectionId,
  isCompleted: (entry) => entry.status === "watched",
  discover: (seedId) => discoverCollection(seedId),
  memberId: (member) => member.id,
  toCreateEntry: (member) => ({
    tmdbId: member.id,
    title: member.title,
    posterImage: member.posterImage,
    status: "plan_to_watch",
    score: 0,
    releaseDate: member.releaseDate,
    movieStatus: member.movieStatus,
  }),
  bulkUpsert: (entries, collectionId) => bulkUpsertMovies(entries, collectionId),
  notify: (member) =>
    notifyNewCollectionItem({
      mediaType: "filme",
      title: member.title,
      image: member.posterImage ?? undefined,
      url: `https://www.themoviedb.org/movie/${member.id}`,
    }),
};

const gameAdapter: CollectionSyncAdapter<GameLibraryEntry, GameCard, CreateGameLibraryEntry> = {
  label: "jogo",
  findAll: () => gameLibraryModel.findAll(),
  externalId: (entry) => entry.igdbId,
  collectionKey: (entry) => entry.collectionId,
  isCompleted: (entry) => entry.status === "beaten",
  discover: (seedId) => discoverGameCollection(seedId),
  memberId: (member) => member.id,
  toCreateEntry: (member) => ({
    igdbId: member.id,
    title: member.title,
    backgroundImage: member.backgroundImage,
    status: "plan_to_play",
    score: 0,
    released: member.released,
    metacritic: member.metacritic,
    gameStatus: member.gameStatus,
  }),
  bulkUpsert: (entries, collectionId) => bulkUpsertGames(entries, collectionId),
  notify: (member) =>
    notifyNewCollectionItem({
      mediaType: "jogo",
      title: member.title,
      image: igdbAbsoluteImage(member.backgroundImage),
    }),
};

let inFlight: Promise<void> | null = null;

export function refreshCollections(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doRefresh(): Promise<void> {
  await syncOne(animeAdapter);
  await syncOne(movieAdapter);
  await syncOne(gameAdapter);
}

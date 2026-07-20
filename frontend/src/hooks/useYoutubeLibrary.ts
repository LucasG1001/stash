import { useCallback } from "react";
import { useLibraryStore } from "../context/libraryStore";
import * as youtubeLibraryService from "../services/youtubeLibraryService";
import type {
  YoutubeLibraryEntry,
  CreateYoutubeLibraryEntry,
  UpdateYoutubeLibraryEntry,
} from "../types/youtubeLibrary";

export function useYoutubeLibrary() {
  const store = useLibraryStore<YoutubeLibraryEntry, CreateYoutubeLibraryEntry, UpdateYoutubeLibraryEntry>(
    "youtube",
    youtubeLibraryService,
    (entry) => entry.videoId,
    (entry) => entry.collectionId
  );

  const { load } = store;

  const addFromUrl = useCallback(
    async (url: string): Promise<YoutubeLibraryEntry> => {
      const entry = await youtubeLibraryService.addFromUrl(url);
      await load();
      return entry;
    },
    [load]
  );

  const formGroup = useCallback(
    async (ids: string[], name: string) => {
      const collection = await youtubeLibraryService.formGroup(ids, name);
      await load();
      return collection;
    },
    [load]
  );

  const addToGroup = useCallback(
    async (ids: string[], collectionId: number) => {
      await youtubeLibraryService.addToGroup(ids, collectionId);
      await load();
    },
    [load]
  );

  return { ...store, findByVideoId: store.findByExternalId, addFromUrl, formGroup, addToGroup };
}

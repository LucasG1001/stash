import { buildCollectionGroups, type CollectionGroup } from "./buildCollectionGroups";
import type { BookLibraryEntry } from "../types/bookLibrary";

export type BookGroup = CollectionGroup<BookLibraryEntry>;

export function authorKey(entry: BookLibraryEntry): string | null {
  if (!entry.authors) return null;
  const first = entry.authors.split(",")[0]?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return first || null;
}

export function pubTimeOf(entry: BookLibraryEntry): number {
  return entry.publishedDate ? new Date(entry.publishedDate).getTime() : Number.POSITIVE_INFINITY;
}

export function readTimeOf(entry: BookLibraryEntry): number {
  return entry.readAt ? new Date(entry.readAt).getTime() : 0;
}

function byChronology(a: BookLibraryEntry, b: BookLibraryEntry): number {
  const ta = pubTimeOf(a);
  const tb = pubTimeOf(b);
  if (ta !== tb) return ta - tb;
  return a.title.localeCompare(b.title);
}

export function buildBookCollectionGroups(
  entries: BookLibraryEntry[],
  memberFilter?: (entry: BookLibraryEntry) => boolean
): BookGroup[] {
  return buildCollectionGroups(entries, {
    getKey: (e) => {
      const author = authorKey(e);
      return author ? `author-${author}` : `single-${e.googleBooksId}`;
    },
    compareMembers: byChronology,
    reverseMembers: false,
    memberFilter,
  });
}

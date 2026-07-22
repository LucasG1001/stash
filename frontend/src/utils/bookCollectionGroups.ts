import { buildCollectionGroups, sortGroupsByScore, type CollectionGroup } from "./buildCollectionGroups";
import { type ScoreSortDir } from "./librarySort";
import type { BookLibraryEntry } from "../types/bookLibrary";

export type BookGroup = CollectionGroup<BookLibraryEntry>;

export function authorKey(entry: BookLibraryEntry): string | null {
  if (!entry.authors) return null;
  const first = entry.authors.split(",")[0]?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return first || null;
}

function pubTime(entry: BookLibraryEntry): number {
  return entry.publishedDate ? new Date(entry.publishedDate).getTime() : Number.POSITIVE_INFINITY;
}

function byChronology(a: BookLibraryEntry, b: BookLibraryEntry): number {
  const ta = pubTime(a);
  const tb = pubTime(b);
  if (ta !== tb) return ta - tb;
  return a.title.localeCompare(b.title);
}

function latestReadTime(members: BookLibraryEntry[]): number {
  return members.reduce((max, m) => Math.max(max, m.readAt ? new Date(m.readAt).getTime() : 0), 0);
}

function repTime(entry: BookLibraryEntry): number {
  return entry.publishedDate ? new Date(entry.publishedDate).getTime() : 0;
}

export function buildBookCollectionGroups(
  entries: BookLibraryEntry[],
  scoreSortDir: ScoreSortDir,
  readSortDir: "desc" | "asc",
  readSort: boolean,
  publishedSortDir: "desc" | "asc" = "desc"
): BookGroup[] {
  const groups = buildCollectionGroups(entries, {
    getKey: (e) => {
      const author = authorKey(e);
      return author ? `author-${author}` : `single-${e.googleBooksId}`;
    },
    compareMembers: byChronology,
    isCompleted: (m) => m.status === "read",
    reverseMembers: false,
  });

  if (scoreSortDir !== "off") return sortGroupsByScore(groups, scoreSortDir);

  if (readSort) {
    return groups.sort((a, b) => {
      const diff = latestReadTime(a.members) - latestReadTime(b.members);
      return readSortDir === "desc" ? -diff : diff;
    });
  }

  return groups.sort((a, b) => {
    const diff = repTime(a.representative) - repTime(b.representative);
    return publishedSortDir === "desc" ? -diff : diff;
  });
}

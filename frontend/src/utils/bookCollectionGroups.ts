import { compareByScore, type ScoreSortDir } from "./librarySort";
import type { BookLibraryEntry } from "../types/bookLibrary";

export interface BookGroup {
  key: string;
  representative: BookLibraryEntry;
  members: BookLibraryEntry[];
  count: number;
  completedCount: number;
}

export function authorKey(entry: BookLibraryEntry): string | null {
  if (!entry.authors) return null;
  const first = entry.authors.split(",")[0]?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return first || null;
}

function pickRepresentative(ordered: BookLibraryEntry[]): BookLibraryEntry {
  return ordered.find((b) => b.isCover) ?? ordered[0];
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
  readSort: boolean
): BookGroup[] {
  const map = new Map<string, BookLibraryEntry[]>();
  for (const entry of entries) {
    const author = authorKey(entry);
    const key = author ? `author-${author}` : `single-${entry.googleBooksId}`;
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  }

  const groups: BookGroup[] = [];
  map.forEach((members, key) => {
    const ordered = [...members].sort(byChronology);
    const completedCount = ordered.filter((m) => m.status === "read").length;
    groups.push({ key, representative: pickRepresentative(ordered), members: ordered, count: ordered.length, completedCount });
  });

  if (scoreSortDir !== "off") {
    const groupScore = (g: BookGroup) => g.members.reduce((max, m) => Math.max(max, m.score), 0);
    return groups.sort((a, b) => compareByScore({ score: groupScore(a) }, { score: groupScore(b) }, scoreSortDir));
  }

  if (readSort) {
    return groups.sort((a, b) => {
      const diff = latestReadTime(a.members) - latestReadTime(b.members);
      return readSortDir === "desc" ? -diff : diff;
    });
  }

  return groups.sort((a, b) => repTime(b.representative) - repTime(a.representative));
}

import { buildCollectionGroups, pickRepresentative, type CollectionGroup } from "./buildCollectionGroups";
import type { YoutubeLibraryEntry, YoutubeLibraryStatus } from "../types/youtubeLibrary";

export type YoutubeGroup = CollectionGroup<YoutubeLibraryEntry>;

function publishedTime(entry: YoutubeLibraryEntry): number {
  return entry.publishedAt ? new Date(entry.publishedAt).getTime() : 0;
}

// Para a ordenação por data: vídeo sem data não deve virar "o mais antigo".
export function videoDateOf(entry: YoutubeLibraryEntry): number {
  return entry.publishedAt ? new Date(entry.publishedAt).getTime() : Number.POSITIVE_INFINITY;
}

export function viewsOf(entry: YoutubeLibraryEntry): number {
  return entry.viewCount ?? 0;
}

function byPublishedAsc(a: YoutubeLibraryEntry, b: YoutubeLibraryEntry): number {
  const diff = publishedTime(a) - publishedTime(b);
  return diff !== 0 ? diff : a.videoId.localeCompare(b.videoId);
}

export function buildYoutubeCollectionGroups(entries: YoutubeLibraryEntry[]): YoutubeGroup[] {
  return buildCollectionGroups(entries, {
    getKey: (e) => (e.collectionId != null ? `collection-${e.collectionId}` : `single-${e.videoId}`),
    compareMembers: byPublishedAsc,
  });
}

export function applyStatusView(groups: YoutubeGroup[], status: YoutubeLibraryStatus): YoutubeGroup[] {
  const result: YoutubeGroup[] = [];
  for (const g of groups) {
    const isCollection = g.representative.collectionId != null;

    if (status === "removed") {
      // Coleção com ao menos um removido aparece inteira; avulso só se for removido.
      if (isCollection) {
        if (g.members.some((m) => m.status === "removed")) result.push(g);
      } else if (g.representative.status === "removed") {
        result.push(g);
      }
      continue;
    }

    // status === "liked": esconder membros removidos das coleções.
    if (isCollection) {
      const liked = g.members.filter((m) => m.status === "liked");
      if (liked.length === 0) continue;
      const ordered = [...liked].sort(byPublishedAsc);
      const representative = pickRepresentative(ordered);
      result.push({
        key: g.key,
        representative,
        members: [...ordered].reverse(),
        // Denominador = total da coleção (não muda); numerador = curtidos mostrados. Ex.: 3/4.
        count: g.count,
        completedCount: ordered.length,
      });
    } else if (g.representative.status === "liked") {
      result.push(g);
    }
  }
  return result;
}

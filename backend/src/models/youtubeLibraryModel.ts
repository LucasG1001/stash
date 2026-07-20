import { pool } from "../database/connection.js";
import { createLibraryModel } from "../lib/createLibraryModel.js";
import type {
  YoutubeLibraryEntry,
  CreateYoutubeLibraryEntry,
  UpdateYoutubeLibraryEntry,
  YoutubeCollection,
} from "../types/youtubeLibrary.js";

export const youtubeLibraryModel = createLibraryModel<
  YoutubeLibraryEntry,
  CreateYoutubeLibraryEntry,
  UpdateYoutubeLibraryEntry
>({
  table: "youtube_library",
  externalId: { column: "video_id", field: "videoId" },
  fields: [
    { column: "title", field: "title" },
    { column: "channel_id", field: "channelId", default: null },
    { column: "channel_title", field: "channelTitle", default: null },
    { column: "channel_thumbnail", field: "channelThumbnail", default: null },
    { column: "thumbnail", field: "thumbnail", default: null },
    { column: "duration_seconds", field: "durationSeconds", default: 0, numeric: true },
    { column: "view_count", field: "viewCount", default: 0, numeric: true },
    { column: "published_at", field: "publishedAt", default: null },
    { column: "description", field: "description", default: null },
    { column: "status", field: "status", default: "plan_to_watch" },
    { column: "score", field: "score", default: 0, numeric: true },
    { column: "collection_id", field: "collectionId", default: null },
    { column: "is_cover", field: "isCover", default: false, readonly: true },
  ],
  statusField: "status",
  completion: { column: "liked_at", field: "likedAt", whenStatus: "liked" },
  collectionColumn: "collection_id",
  rewatch: { column: "is_rewatching", field: "isRewatching" },
});

export async function createCollection(name: string): Promise<YoutubeCollection> {
  const result = await pool.query<YoutubeCollection>(
    `INSERT INTO youtube_collection (name) VALUES ($1) RETURNING id, name`,
    [name]
  );
  return result.rows[0];
}

export async function renameCollection(id: number, name: string): Promise<YoutubeCollection | null> {
  const result = await pool.query<YoutubeCollection>(
    `UPDATE youtube_collection SET name = $2, updated_at = NOW() WHERE id = $1 RETURNING id, name`,
    [id, name]
  );
  return result.rows[0] ?? null;
}

export async function assignCollection(ids: string[], collectionId: number): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await pool.query(
    `UPDATE youtube_library SET collection_id = $2, updated_at = NOW() WHERE id = ANY($1::uuid[])`,
    [ids, collectionId]
  );
  return result.rowCount ?? 0;
}

export async function listCollections(): Promise<YoutubeCollection[]> {
  const result = await pool.query<YoutubeCollection>(
    `SELECT c.id, c.name
       FROM youtube_collection c
       JOIN youtube_library l ON l.collection_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name ASC`
  );
  return result.rows;
}

export async function pruneEmptyCollections(): Promise<void> {
  await pool.query(
    `DELETE FROM youtube_collection c
      WHERE NOT EXISTS (SELECT 1 FROM youtube_library l WHERE l.collection_id = c.id)`
  );
}

import { pool } from "../database/connection.js";
import type { LibraryEntry, LibraryRow, CreateLibraryEntry, UpdateLibraryEntry, SyncLibraryData } from "../types/library.js";

function toLibraryEntry(row: LibraryRow): LibraryEntry {
  return {
    id: row.id,
    anilistId: row.anilist_id,
    title: row.title,
    coverImage: row.cover_image,
    status: row.status,
    score: parseFloat(row.score),
    totalEpisodes: row.total_episodes,
    animeStatus: row.anime_status,
    franchiseId: row.franchise_id,
    format: row.format,
    seasonYear: row.season_year,
    nextAiringEpisode: row.next_airing_episode,
    streamingLinks: row.streaming_links ?? [],
    syncedAt: row.synced_at,
    watchedAt: row.watched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findAll(): Promise<LibraryEntry[]> {
  const result = await pool.query<LibraryRow>("SELECT * FROM anime_library ORDER BY updated_at DESC");
  return result.rows.map(toLibraryEntry);
}

export async function findById(id: string): Promise<LibraryEntry | null> {
  const result = await pool.query<LibraryRow>("SELECT * FROM anime_library WHERE id = $1", [id]);
  return result.rows[0] ? toLibraryEntry(result.rows[0]) : null;
}

export async function findByAnilistId(anilistId: number): Promise<LibraryEntry | null> {
  const result = await pool.query<LibraryRow>("SELECT * FROM anime_library WHERE anilist_id = $1", [anilistId]);
  return result.rows[0] ? toLibraryEntry(result.rows[0]) : null;
}

export async function findStale(nonFinishedTtlHours: number, finishedTtlHours: number): Promise<LibraryEntry[]> {
  const result = await pool.query<LibraryRow>(
    `SELECT * FROM anime_library
     WHERE synced_at IS NULL
        OR season_year IS NULL
        OR (anime_status != 'FINISHED' AND synced_at < NOW() - ($1 || ' hours')::interval)
        OR (anime_status = 'FINISHED' AND synced_at < NOW() - ($2 || ' hours')::interval)`,
    [nonFinishedTtlHours, finishedTtlHours]
  );
  return result.rows.map(toLibraryEntry);
}

export async function create(entry: CreateLibraryEntry): Promise<LibraryEntry> {
  const result = await pool.query<LibraryRow>(
    `INSERT INTO anime_library
       (anilist_id, title, cover_image, status, score, total_episodes, anime_status, season_year, next_airing_episode, streaming_links, synced_at, watched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), CASE WHEN $4 = 'watched' THEN NOW() ELSE NULL END)
     RETURNING *`,
    [
      entry.anilistId,
      entry.title,
      entry.coverImage ?? null,
      entry.status ?? "plan_to_watch",
      entry.score ?? 0,
      entry.totalEpisodes ?? null,
      entry.animeStatus ?? "FINISHED",
      entry.seasonYear ?? null,
      JSON.stringify(entry.nextAiringEpisode ?? null),
      JSON.stringify(entry.streamingLinks ?? []),
    ]
  );
  return toLibraryEntry(result.rows[0]);
}

export async function bulkUpsert(entries: CreateLibraryEntry[], franchiseId: number): Promise<LibraryEntry[]> {
  if (entries.length === 0) return [];

  const values: unknown[] = [];
  const rows: string[] = [];
  let i = 1;

  for (const entry of entries) {
    const statusParam = `$${i + 3}`;
    rows.push(
      `($${i}, $${i + 1}, $${i + 2}, ${statusParam}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8}, $${i + 9}, $${i + 10}, $${i + 11}, NOW(), CASE WHEN ${statusParam} = 'watched' THEN NOW() ELSE NULL END)`
    );
    values.push(
      entry.anilistId,
      entry.title,
      entry.coverImage ?? null,
      entry.status ?? "plan_to_watch",
      entry.score ?? 0,
      entry.totalEpisodes ?? null,
      entry.animeStatus ?? "FINISHED",
      entry.seasonYear ?? null,
      JSON.stringify(entry.nextAiringEpisode ?? null),
      JSON.stringify(entry.streamingLinks ?? []),
      franchiseId,
      entry.format ?? null
    );
    i += 12;
  }

  const result = await pool.query<LibraryRow>(
    `INSERT INTO anime_library
       (anilist_id, title, cover_image, status, score, total_episodes, anime_status, season_year, next_airing_episode, streaming_links, franchise_id, format, synced_at, watched_at)
     VALUES ${rows.join(", ")}
     ON CONFLICT (anilist_id) DO UPDATE SET
       franchise_id = COALESCE(anime_library.franchise_id, EXCLUDED.franchise_id),
       format = COALESCE(anime_library.format, EXCLUDED.format)
     RETURNING *`,
    values
  );
  return result.rows.map(toLibraryEntry);
}

export async function update(id: string, data: UpdateLibraryEntry): Promise<LibraryEntry | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.coverImage !== undefined) {
    fields.push(`cover_image = $${paramIndex++}`);
    values.push(data.coverImage);
  }
  if (data.status !== undefined) {
    const statusParam = paramIndex++;
    fields.push(`status = $${statusParam}`);
    values.push(data.status);
    fields.push(
      `watched_at = CASE
         WHEN $${statusParam} = 'watched' AND status != 'watched' THEN NOW()
         WHEN $${statusParam} != 'watched' THEN NULL
         ELSE watched_at
       END`
    );
  }
  if (data.score !== undefined) {
    fields.push(`score = $${paramIndex++}`);
    values.push(data.score);
  }
  if (data.totalEpisodes !== undefined) {
    fields.push(`total_episodes = $${paramIndex++}`);
    values.push(data.totalEpisodes);
  }
  if (data.animeStatus !== undefined) {
    fields.push(`anime_status = $${paramIndex++}`);
    values.push(data.animeStatus);
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<LibraryRow>(
    `UPDATE anime_library SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] ? toLibraryEntry(result.rows[0]) : null;
}

export async function updateSyncData(anilistId: number, data: SyncLibraryData): Promise<void> {
  await pool.query(
    `UPDATE anime_library
     SET total_episodes = $2,
         anime_status = $3,
         next_airing_episode = $4,
         streaming_links = $5,
         season_year = $6,
         synced_at = NOW()
     WHERE anilist_id = $1`,
    [
      anilistId,
      data.totalEpisodes,
      data.animeStatus,
      JSON.stringify(data.nextAiringEpisode ?? null),
      JSON.stringify(data.streamingLinks ?? []),
      data.seasonYear ?? null,
    ]
  );
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM anime_library WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

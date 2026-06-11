import { pool } from "./connection.js";

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anime_library (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      anilist_id       INTEGER NOT NULL UNIQUE,
      title            TEXT NOT NULL,
      cover_image      TEXT,
      status           TEXT NOT NULL DEFAULT 'plan_to_watch',
      score            NUMERIC(3,1) DEFAULT 0,
      watched_episodes INTEGER NOT NULL DEFAULT 0,
      total_episodes   INTEGER DEFAULT 0,
      anime_status     TEXT NOT NULL DEFAULT 'FINISHED',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE anime_library
    ADD COLUMN IF NOT EXISTS anime_status TEXT NOT NULL DEFAULT 'FINISHED';
  `);

  await pool.query(`
    ALTER TABLE anime_library
    ADD COLUMN IF NOT EXISTS next_airing_episode JSONB,
    ADD COLUMN IF NOT EXISTS streaming_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS watched_at TIMESTAMPTZ;
  `);
}

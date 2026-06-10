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
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

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
    ADD COLUMN IF NOT EXISTS watched_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS season_year INTEGER;
  `);

  await pool.query(`
    ALTER TABLE anime_library
    ADD COLUMN IF NOT EXISTS franchise_id INTEGER,
    ADD COLUMN IF NOT EXISTS format TEXT;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_anime_library_franchise_id ON anime_library (franchise_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS movie_library (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tmdb_id       INTEGER NOT NULL UNIQUE,
      title         TEXT NOT NULL,
      poster_image  TEXT,
      status        TEXT NOT NULL DEFAULT 'plan_to_watch',
      score         NUMERIC(3,1) DEFAULT 0,
      release_date  TEXT,
      runtime       INTEGER,
      movie_status  TEXT NOT NULL DEFAULT 'RELEASED',
      watched_at    TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE movie_library
    ADD COLUMN IF NOT EXISTS collection_id INTEGER;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_movie_library_collection_id ON movie_library (collection_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS series_library (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tmdb_id         INTEGER NOT NULL UNIQUE,
      title           TEXT NOT NULL,
      poster_image    TEXT,
      status          TEXT NOT NULL DEFAULT 'plan_to_watch',
      score           NUMERIC(3,1) DEFAULT 0,
      first_air_date  TEXT,
      seasons         INTEGER,
      episodes        INTEGER,
      series_status   TEXT NOT NULL DEFAULT 'RELEASED',
      watched_at      TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'game_library' AND column_name = 'rawg_id'
      ) THEN
        DROP TABLE game_library;
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_library (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      igdb_id           INTEGER NOT NULL UNIQUE,
      title             TEXT NOT NULL,
      background_image  TEXT,
      status            TEXT NOT NULL DEFAULT 'plan_to_play',
      score             NUMERIC(3,1) DEFAULT 0,
      released          TEXT,
      metacritic        INTEGER,
      game_status       TEXT NOT NULL DEFAULT 'RELEASED',
      finished_at       TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    UPDATE game_library
    SET background_image = REPLACE(background_image, 'https://images.igdb.com/igdb/image/upload', '/api/game/image')
    WHERE background_image LIKE 'https://images.igdb.com/igdb/image/upload/%';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS books_library (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_books_id  TEXT NOT NULL UNIQUE,
      title            TEXT NOT NULL,
      cover_image      TEXT,
      authors          TEXT,
      status           TEXT NOT NULL DEFAULT 'plan_to_read',
      score            NUMERIC(3,1) DEFAULT 0,
      published_date   TEXT,
      page_count       INTEGER,
      read_at          TIMESTAMPTZ,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

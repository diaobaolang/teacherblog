CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  id         SERIAL PRIMARY KEY,
  content    TEXT,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carousel_images (
  id          SERIAL PRIMARY KEY,
  image_url   TEXT NOT NULL,
  title       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT,
  cover_image TEXT,
  summary     TEXT,
  status      TEXT DEFAULT 'draft',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL PRIMARY KEY,
  nickname     TEXT NOT NULL,
  content      TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS photo_groups (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  cover_image TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES photo_groups(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  title       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_groups (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  cover_image TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_photos (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  title       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

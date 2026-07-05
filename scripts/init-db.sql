-- 星評価機能用テーブル定義
-- Vercel Postgres (Storage タブ) でDBを作成した後、
-- 1回だけ実行してください（Vercelダッシュボードの Query タブ、または `psql` から）。
-- ※ このSQLを実行しなくても、初回アクセス時にAPI側が自動でテーブルを作成します。
--   手動で確認・作成したい場合の参考として置いています。

CREATE TABLE IF NOT EXISTS course_ratings (
  id SERIAL PRIMARY KEY,
  course_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings (course_id);

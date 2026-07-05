import { createPool, VercelPool } from "@vercel/postgres";

// @vercel/postgresのデフォルトsqlエクスポートはPOSTGRES_URLしか見ないが、
// VercelのNeon連携が発行するのはDATABASE_URL（プール接続）のため、
// connectionStringを明示的に指定する。
// createPool()はconnectionStringが無いと即座に例外を投げるため、
// モジュール読み込み時ではなく実際にクエリが必要になったタイミングで
// 遅延生成する（DB未接続時にビルドやページ全体が落ちないようにするため）。
let pool: VercelPool | null = null;
function getPool(): VercelPool {
  if (!pool) {
    pool = createPool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    });
  }
  return pool;
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await getPool().sql`
        CREATE TABLE IF NOT EXISTS course_ratings (
          id SERIAL PRIMARY KEY,
          course_id TEXT NOT NULL,
          visitor_id TEXT NOT NULL,
          rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (course_id, visitor_id)
        );
      `;
      await getPool().sql`
        CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings (course_id);
      `;
    })().catch((error) => {
      // Allow retry on next call instead of caching a permanent failure
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

export interface RatingSummary {
  average: number;
  count: number;
}

function toSummary(row: { average: string | null; count: string }): RatingSummary {
  const average = row.average ? Math.round(parseFloat(row.average) * 10) / 10 : 0;
  return {
    average,
    count: parseInt(row.count, 10) || 0,
  };
}

export async function getAllRatingSummaries(): Promise<Record<string, RatingSummary>> {
  await ensureTable();
  const { rows } = await getPool().sql<{ course_id: string; average: string | null; count: string }>`
    SELECT course_id, AVG(rating)::numeric(3,2) AS average, COUNT(*) AS count
    FROM course_ratings
    GROUP BY course_id;
  `;
  const result: Record<string, RatingSummary> = {};
  for (const row of rows) {
    result[row.course_id] = toSummary(row);
  }
  return result;
}

export async function getMyRatings(visitorId: string): Promise<Record<string, number>> {
  if (!visitorId) return {};
  await ensureTable();
  const { rows } = await getPool().sql<{ course_id: string; rating: number }>`
    SELECT course_id, rating FROM course_ratings WHERE visitor_id = ${visitorId};
  `;
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.course_id] = row.rating;
  }
  return result;
}

export async function upsertRating(
  courseId: string,
  visitorId: string,
  rating: number
): Promise<RatingSummary> {
  await ensureTable();
  await getPool().sql`
    INSERT INTO course_ratings (course_id, visitor_id, rating)
    VALUES (${courseId}, ${visitorId}, ${rating})
    ON CONFLICT (course_id, visitor_id)
    DO UPDATE SET rating = EXCLUDED.rating, updated_at = now();
  `;
  const { rows } = await getPool().sql<{ average: string | null; count: string }>`
    SELECT AVG(rating)::numeric(3,2) AS average, COUNT(*) AS count
    FROM course_ratings WHERE course_id = ${courseId};
  `;
  return toSummary(rows[0]);
}

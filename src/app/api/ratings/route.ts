import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import coursesData from "@/data/courses.json";
import { getAllRatingSummaries, getMyRatings, upsertRating } from "@/lib/ratings";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "bal_visitor_id";
const VALID_COURSE_IDS = new Set(coursesData.map((c) => c.id));
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1年

export async function GET(request: NextRequest) {
  const visitorId = request.cookies.get(VISITOR_COOKIE)?.value ?? "";

  try {
    const [summaries, mine] = await Promise.all([
      getAllRatingSummaries(),
      getMyRatings(visitorId),
    ]);
    return NextResponse.json({ summaries, mine });
  } catch (error) {
    console.error("[api/ratings][GET] failed:", error);
    // DB未設定・接続エラー時もアプリ自体は壊さず空データを返す
    return NextResponse.json({ summaries: {}, mine: {} });
  }
}

export async function POST(request: NextRequest) {
  let body: { courseId?: unknown; rating?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { courseId, rating } = body;

  if (typeof courseId !== "string" || !VALID_COURSE_IDS.has(courseId)) {
    return NextResponse.json({ error: "invalid_course_id" }, { status: 400 });
  }
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
  }

  const existingVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || randomUUID();

  try {
    const summary = await upsertRating(courseId, visitorId, rating);
    const response = NextResponse.json({ summary, myRating: rating });
    if (!existingVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        maxAge: VISITOR_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
      });
    }
    return response;
  } catch (error) {
    console.error("[api/ratings][POST] failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

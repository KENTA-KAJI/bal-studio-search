"use client";

import { useCallback, useEffect, useState } from "react";

export interface RatingSummary {
  average: number;
  count: number;
}

interface RatingsState {
  summaries: Record<string, RatingSummary>;
  mine: Record<string, number>;
  loaded: boolean;
}

export function useCourseRatings() {
  const [state, setState] = useState<RatingsState>({
    summaries: {},
    mine: {},
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ratings")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setState({
          summaries: data.summaries || {},
          mine: data.mine || {},
          loaded: true,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loaded: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rate = useCallback(async (courseId: string, rating: number) => {
    // 楽観的更新：送信結果を待たず先に反映（失敗時にロールバックできるよう直前の値を保持）
    let previousRating: number | undefined;
    setState((prev) => {
      previousRating = prev.mine[courseId];
      return {
        ...prev,
        mine: { ...prev.mine, [courseId]: rating },
      };
    });

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating }),
      });
      if (!res.ok) throw new Error(`Rating submit failed: ${res.status}`);
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        summaries: { ...prev.summaries, [courseId]: data.summary },
        mine: { ...prev.mine, [courseId]: data.myRating },
      }));
      return true;
    } catch (error) {
      console.error("[useCourseRatings] rate failed:", error);
      // 失敗時は楽観的更新をロールバック（未評価だった場合はキー自体を削除）
      setState((prev) => {
        const nextMine = { ...prev.mine };
        if (previousRating === undefined) {
          delete nextMine[courseId];
        } else {
          nextMine[courseId] = previousRating;
        }
        return { ...prev, mine: nextMine };
      });
      return false;
    }
  }, []);

  return { summaries: state.summaries, mine: state.mine, loaded: state.loaded, rate };
}

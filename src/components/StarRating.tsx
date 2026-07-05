"use client";

import { useRef, useState } from "react";

const StarIcon = ({ className }: { className: string }) => (
  <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
    <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.6 1-5.8L1.6 7.6l5.8-.8L10 1.5z" />
  </svg>
);

// 食べログ風：平均点を数値で強調し、星は補助的に表示する読み取り専用バッジ
export function RatingBadge({
  average,
  count,
  size = "sm",
}: {
  average: number;
  count: number;
  size?: "sm" | "md";
}) {
  const starClass = size === "md" ? "w-4 h-4" : "w-3 h-3";
  const textClass = size === "md" ? "text-sm" : "text-xs";

  if (!count || average <= 0) {
    return (
      <span className={`${textClass} text-muted/70 select-none`}>まだ評価がありません</span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 select-none">
      <StarIcon className={`${starClass} text-accent`} />
      <span className={`${textClass} font-bold text-foreground`}>{average.toFixed(1)}</span>
      <span className={`${size === "md" ? "text-xs" : "text-[10px]"} text-muted`}>
        （{count}件）
      </span>
    </span>
  );
}

// クリックで1〜5の評価を送信する入力用コンポーネント
export function RatingInput({
  myRating,
  onRate,
  disabled = false,
}: {
  myRating?: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const displayValue = hoverValue ?? myRating ?? 0;

  const handleClick = async (star: number) => {
    // submitting stateの更新はReactの再レンダリングを待つため、
    // 連打時にレンダリング前の2クリック目が素通りしてしまう。
    // refで同期的にロックして二重送信を防ぐ。
    if (disabled || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onRate(star);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="この講座を評価する"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || submitting}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(null)}
          onClick={() => handleClick(star)}
          className="disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`${star}点`}
        >
          <StarIcon
            className={`w-5 h-5 transition-colors ${
              displayValue >= star ? "text-accent" : "text-border"
            } ${!disabled ? "hover:text-accent/70" : ""}`}
          />
        </button>
      ))}
      {myRating ? (
        <span className="text-[10px] text-muted ml-1">あなたの評価：{myRating}</span>
      ) : null}
    </div>
  );
}

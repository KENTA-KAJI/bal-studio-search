"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SearchTags from "@/components/SearchTags";
import VideoCard, { VideoData, CourseData } from "@/components/VideoCard";

// Import dummy data
import coursesData from "@/data/courses.json";
import videosData from "@/data/videos.json";

const TAG_CATEGORIES = [
  {
    title: "分野から探す",
    tags: [
      "解剖学", "運動器以外の系統解剖学", "栄養学", "医学", "神経科学", 
      "進化生物学", "東洋医学", "呼吸", "バイオメカニクス", "コンディショニング", 
      "筋膜連結", "ファシア", "評価", "姿勢", "動作分析", 
      "歩行", "ランニング", "身体操作", "トレーニング", "パフォーマンスアップ", 
      "ピラティス", "女性指導", "フェムテック", "男性機能改善", "ボディメイク", 
      "マーケティング"
    ]
  },
  {
    title: "目的から探す",
    tags: [
      "はじめての方へ｜まず見るべき動画", "明日の現場で使いたい", "初回評価の精度を上げたい", 
      "継続される指導を作りたい", "不調相談に強くなりたい", "見た目の変化まで出したい", 
      "食事まで提案できるようになりたい", "自分だけの専門性を作りたい", "集客・売上につなげたい"
    ]
  },
  {
    title: "部位・テーマから探す",
    tags: [
      "肩こり", "腰痛", "股関節", "膝", "足部", 
      "足関節", "肩", "肩甲骨", "胸郭", "脊柱", 
      "骨盤", "呼吸", "筋肉", "骨学", "筋膜", 
      "Fascia", "内臓", "女性リズム", "美脚", "小顔"
    ]
  }
];

function SearchContent() {
  const [query, setQuery] = useState("");
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";

  // Process data
  const filteredVideos = useMemo(() => {
    // Filter out non-public videos
    const publicVideos = videosData.filter(v => v.status !== "非公開" && v.status !== "準備中");

    if (!query.trim()) return publicVideos as VideoData[];

    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    return (publicVideos as VideoData[]).filter((video) => {
      const course = coursesData.find((c) => c.id === video.courseId) as unknown as CourseData;
      
      const combinedText = [
        course?.title,
        course?.instructor,
        course?.category,
        course?.level,
        course?.description,
        ...(course?.commonTags || []),
        course?.recommendedFor,
        video.title,
        video.videoDescription,
        ...(video.individualTags || [])
      ].filter(Boolean).join(" ").toLowerCase();

      // All keywords must be found in the combined text (AND search)
      return keywords.every(keyword => combinedText.includes(keyword));
    });
  }, [query]);

  // Reset tag expansion when query is cleared
  useMemo(() => {
    if (!query.trim()) {
      setIsTagsExpanded(false);
    }
  }, [query]);

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setIsTagsExpanded(false);
  };

  return (
    <div className={`min-h-screen bg-background text-foreground ${isEmbed ? "px-4 pt-2 pb-6" : "p-8 md:p-12"}`}>
      {!isEmbed ? (
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            BAL STUDIO <span className="text-accent">Search</span>
          </h1>
          <div className="text-muted text-sm md:text-base max-w-3xl mx-auto space-y-1 leading-relaxed">
            <p>この検索ページでは、BALで配信している講義・動画を分野・目的・キーワードから検索できます。</p>
            <p>BAL STUDIO会員の方は、対象講義をすべて視聴できます。</p>
            <p>単品購入・過去購入済みの方は、ご自身の視聴権限がある講義のみ視聴できます。</p>
            <p>動画の視聴にはVideogへのログインが必要です。</p>
          </div>
        </header>
      ) : (
        <div className="mb-6 text-muted text-[10px] leading-tight space-y-0.5 opacity-80">
          <p>この検索ページでは、BALの講義・動画を検索できます。</p>
          <p>BAL STUDIO会員の方は全視聴可。単品購入者は権限がある動画のみ可。</p>
          <p>視聴にはVideogログインが必要です。</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto">
        <SearchBar 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          className="mb-8"
        />

        {query.trim() ? (
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm md:text-base text-foreground font-medium">
                「<span className="text-accent">{query}</span>」の検索結果：
                <span className="text-accent font-bold ml-1">{filteredVideos.length}</span>件
              </div>
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="text-[10px] md:text-xs text-muted hover:text-accent flex items-center gap-1.5 transition-colors border border-border/50 px-3 py-1.5 rounded-lg bg-card/30"
              >
                {isTagsExpanded ? "検索タグを閉じる" : "検索タグを表示"}
                <svg
                  className={`w-3 h-3 transition-transform duration-300 ${isTagsExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {isTagsExpanded && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-border/30">
                <SearchTags 
                  categories={TAG_CATEGORIES} 
                  selectedTag={query} 
                  onTagClick={handleTagClick}
                  isEmbed={isEmbed}
                />
              </div>
            )}
          </div>
        ) : (
          <SearchTags 
            categories={TAG_CATEGORIES} 
            selectedTag={query} 
            onTagClick={handleTagClick}
            isEmbed={isEmbed}
          />
        )}

        {filteredVideos.length === 0 ? (
          <div className="text-center text-muted mt-16 py-12 bg-card rounded-2xl border border-border">
            <p className="text-lg">「{query}」に一致する動画は見つかりませんでした。</p>
            <p>別のキーワードをお試しください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => {
              const course = coursesData.find((c) => c.id === video.courseId) as unknown as CourseData;
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  course={course}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground p-8">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}

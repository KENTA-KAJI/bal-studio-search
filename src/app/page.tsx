"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
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
      "歩行", "ランニング", "身体操作", "パフォーマンスアップ", 
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
    title: "シリーズから探す",
    tags: [
      "長編コンテンツ",
      "NEXT（短編コンテンツ）",
      "LIVE SESSION",
      "プロトレーナー研究所"
    ]
  },
  {
    title: "レベルから探す",
    tags: ["初級", "中級", "上級"]
  },
  {
    title: "部位・テーマから探す",
    tags: [
      "トレーニング", "ストレッチ",
      "肩こり", "腰痛", "股関節", "膝", "足部", 
      "足関節", "肩", "肩甲骨", "胸郭", "脊柱", 
      "骨盤", "呼吸", "筋肉", "骨学", "筋膜", 
      "Fascia", "内臓", "女性リズム", "美脚", "小顔"
    ]
  }
];

const LEVEL_NAMES = ["初級", "中級", "上級"];
const SERIES_NAMES = [
  "長編コンテンツ",
  "NEXT（短編コンテンツ）",
  "LIVE SESSION",
  "プロトレーナー研究所"
];
const CATEGORY_NAMES = [
  "解剖学",
  "運動器以外の系統解剖学",
  "栄養学",
  "医学",
  "神経科学",
  "進化生物学",
  "東洋医学",
  "呼吸",
  "バイオメカニクス",
  "コンディショニング",
  "筋膜連結",
  "Fascia",
  "ファシア",
  "評価",
  "姿勢",
  "動作分析",
  "代償動作",
  "歩行",
  "ランニング",
  "身体操作",
  "トレーニング",
  "セッション設計",
  "パフォーマンスアップ",
  "タイ古式マッサージ",
  "ピラティス",
  "女性指導",
  "フェムテック",
  "男性機能改善",
  "ボディメイク",
  "美脚",
  "小顔",
  "マーケティング"
];

const matchesTag = (video: VideoData, course: CourseData, tag: string) => {
  const normalizedTag = tag.trim().toLowerCase();
  
  if (LEVEL_NAMES.some(lvl => lvl.toLowerCase() === normalizedTag)) {
    return course?.level?.toLowerCase() === normalizedTag;
  }

  if (SERIES_NAMES.some(s => s.toLowerCase() === normalizedTag)) {
    const courseSeries = course?.series || "";
    return courseSeries.toLowerCase() === normalizedTag;
  }

  const isCategoryQuery = CATEGORY_NAMES.some(cat => cat.toLowerCase() === normalizedTag) &&
                          coursesData.some(c => c.category && c.category.toLowerCase() === normalizedTag);
  if (isCategoryQuery) {
    const categoryMatches = (course?.category?.toLowerCase() === normalizedTag) ||
      (normalizedTag === "解剖学" && course?.category === "運動器以外の系統解剖学");

    const commonTagsMatches = course?.commonTags ? course.commonTags.some(t => t.toLowerCase() === normalizedTag) : false;

    return categoryMatches || commonTagsMatches;
  }

  const combinedText = [
    course?.title,
    course?.instructor,
    course?.category,
    course?.level,
    ...(course?.commonTags || []),
    video.title,
    ...(video.individualTags || [])
  ].filter(Boolean).join(" ").toLowerCase();

  return combinedText.includes(normalizedTag);
};

const matchesQuery = (video: VideoData, course: CourseData, queryText: string) => {
  if (!queryText.trim()) return true;
  const keywords = queryText.toLowerCase().split(/\s+/).filter(Boolean);
  
  const combinedText = [
    course.title,
    course.instructor,
    course.category,
    course.level,
    ...(course.commonTags || []),
    video.title,
    ...(video.individualTags || [])
  ].filter(Boolean).join(" ").toLowerCase();

  return keywords.every(keyword => combinedText.includes(keyword));
};

function SearchContent() {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";

  useEffect(() => {
    if (!isHowToOpen) return;
    
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 4);
    }, 2500);

    return () => clearInterval(interval);
  }, [isHowToOpen]);

  // Process data
  const filteredVideos = useMemo(() => {
    // Filter out non-public videos
    const publicVideos = videosData.filter(v => v.status !== "非公開" && v.status !== "準備中") as VideoData[];

    return publicVideos.filter((video) => {
      const course = coursesData.find((c) => c.id === video.courseId) as unknown as CourseData;
      if (!course) return false;
      
      const matchesAllTags = selectedTags.every(tag => matchesTag(video, course, tag));
      if (!matchesAllTags) return false;

      return matchesQuery(video, course, query);
    });
  }, [query, selectedTags]);

  // Dynamically filter tag list based on search matches
  const availableTagCategories = useMemo(() => {
    const publicVideos = videosData.filter(v => v.status !== "非公開" && v.status !== "準備中") as VideoData[];

    return TAG_CATEGORIES.map((category) => {
      const filteredTags = category.tags.filter((tag) => {
        // Do not show tags that are already selected
        if (selectedTags.includes(tag)) return false;

        // If no selected tags and no text search query, show all tags
        if (selectedTags.length === 0 && !query.trim()) return true;

        const candidateTags = [...selectedTags, tag];
        
        return publicVideos.some((video) => {
          const course = coursesData.find((c) => c.id === video.courseId) as unknown as CourseData;
          if (!course) return false;
          
          const matchesAllCandidateTags = candidateTags.every(t => matchesTag(video, course, t));
          if (!matchesAllCandidateTags) return false;

          return matchesQuery(video, course, query);
        });
      });

      return {
        title: category.title,
        tags: filteredTags
      };
    });
  }, [query, selectedTags]);

  const hasAnyAvailableTags = useMemo(() => {
    return availableTagCategories.some(cat => cat.tags.length > 0);
  }, [availableTagCategories]);


  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
    setIsTagsExpanded(false);
  };

  const combinedSearchQuery = [...selectedTags, query.trim()].filter(Boolean).join(" + ");

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
        {/* Accordion container */}
        <div className="max-w-2xl mx-auto mb-6">
          <button
            onClick={() => setIsHowToOpen(!isHowToOpen)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl border border-border bg-card/40 hover:bg-card/75 transition-all text-xs font-semibold text-muted hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>💡 使い方を見る</span>
            </div>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${isHowToOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isHowToOpen && (
            <div className="mt-3 bg-card/25 border border-border/80 rounded-2xl p-5 md:p-6 animate-in fade-in slide-in-from-top-3 duration-300">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                {/* Left side: Guide */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-bold text-accent">
                    講座の探し方
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    分野・目的・シリーズ・レベル・部位テーマを組み合わせて、見たい講座を絞り込めます。
                  </p>
                  <div className="space-y-2.5 text-xs text-foreground/90">
                    <div className="flex gap-2">
                      <span className="text-accent font-bold">①</span>
                      <div>
                        <p className="font-semibold">まず分野を選ぶ</p>
                        <p className="text-muted text-[11px] mt-0.5">例：解剖学</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-accent font-bold">②</span>
                      <div>
                        <p className="font-semibold">絞り込み条件を追加する</p>
                        <p className="text-muted text-[11px] mt-0.5">例：はじめての方へ｜まず見るべき動画 / 初級 / 長編コンテンツ</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-accent font-bold">③</span>
                      <div>
                        <p className="font-semibold">必要ならキーワードも入力する</p>
                        <p className="text-muted text-[11px] mt-0.5">例：骨、呼吸、歩行 など</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted italic">
                    ※ 条件を追加すると、該当する講座がある項目だけが表示されます。
                  </p>
                </div>

                {/* Right side: Demo */}
                <div className="w-full md:w-auto flex-shrink-0">
                  <div className="bg-card border border-border/80 p-4 rounded-xl w-full max-w-[280px] mx-auto flex flex-col gap-3 font-sans text-[11px] shadow-sm">
                    <div className="text-[10px] text-muted/80 uppercase font-bold tracking-wider border-b border-border/40 pb-1.5 flex justify-between items-center">
                      <span>絞り込みデモ</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    </div>
                    
                    {/* Simulated search box */}
                    <div className="h-7 bg-background border border-border/60 rounded-full flex items-center px-3 text-muted/40 select-none">
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>キーワードを入力...</span>
                    </div>

                    {/* Simulated tag selection */}
                    <div className="min-h-[24px] flex flex-wrap gap-1 items-center">
                      {demoStep >= 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40 text-[9px] text-accent font-medium transition-all duration-200">
                          解剖学 <span className="opacity-60">×</span>
                        </span>
                      )}
                      {demoStep >= 1 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40 text-[9px] text-accent font-medium animate-in zoom-in duration-300">
                          初級 <span className="opacity-60">×</span>
                        </span>
                      )}
                      {demoStep >= 2 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40 text-[9px] text-accent font-medium animate-in zoom-in duration-300">
                          長編コンテンツ <span className="opacity-60">×</span>
                        </span>
                      )}
                    </div>

                    {/* Simulated result indicator */}
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted font-medium bg-card p-1.5 rounded border border-border/40">
                      <span>検索結果：</span>
                      <span className="text-accent font-bold transition-all duration-300">
                        {demoStep === 0 && "8件"}
                        {demoStep === 1 && "3件"}
                        {demoStep === 2 && "3件"}
                        {demoStep === 3 && "3件に絞り込み！"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SearchBar 
          value={query} 
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (!val.trim() && selectedTags.length === 0) {
              setIsTagsExpanded(false);
            }
          }} 
          className="mb-8"
        />

        {/* Selected conditions area */}
        {selectedTags.length > 0 && (
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 bg-card/30 p-4 rounded-xl border border-border/30 animate-in fade-in duration-300">
              <span className="text-xs md:text-sm text-muted font-medium mr-1">選択中の条件：</span>
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-accent/20 border border-accent/40 text-accent font-semibold"
                  >
                    {tag}
                    <button
                      onClick={() => {
                        const newTags = selectedTags.filter((t) => t !== tag);
                        setSelectedTags(newTags);
                        if (newTags.length === 0 && !query.trim()) {
                          setIsTagsExpanded(false);
                        }
                      }}
                      className="hover:text-foreground text-accent/60 ml-1 font-bold text-sm focus:outline-none transition-colors"
                      aria-label={`${tag}を解除`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setIsTagsExpanded(false);
                }}
                className="text-xs text-muted hover:text-accent font-medium px-3 py-1.5 rounded-lg border border-border/50 bg-card/30 transition-colors"
              >
                条件をクリア
              </button>
            </div>
            <p className="text-[11px] text-muted pl-1">
              条件を追加すると、さらに講座を絞り込めます。
            </p>
          </div>
        )}

        {query.trim() || selectedTags.length > 0 ? (
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm md:text-base text-foreground font-medium">
                「<span className="text-accent">{combinedSearchQuery}</span>」の検索結果：
                <span className="text-accent font-bold ml-1">{filteredVideos.length}</span>件
              </div>
              <button
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="text-[10px] md:text-xs text-accent hover:text-accent/80 flex items-center gap-1.5 transition-colors border border-accent/30 px-3 py-1.5 rounded-lg bg-accent/5 font-semibold"
              >
                {isTagsExpanded ? "絞り込み条件を閉じる" : "＋ 絞り込み条件を追加"}
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
                {hasAnyAvailableTags ? (
                  <SearchTags 
                    categories={availableTagCategories} 
                    selectedTags={selectedTags} 
                    onTagClick={handleTagClick}
                    isEmbed={isEmbed}
                  />
                ) : (
                  <div className="text-center text-muted/80 py-8 bg-card/25 rounded-2xl border border-border/30 border-dashed text-xs md:text-sm font-medium">
                    追加できる絞り込み条件はありません
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          hasAnyAvailableTags ? (
            <SearchTags 
              categories={availableTagCategories} 
              selectedTags={selectedTags} 
              onTagClick={handleTagClick}
              isEmbed={isEmbed}
            />
          ) : (
            <div className="text-center text-muted/80 py-8 bg-card/25 rounded-2xl border border-border/30 border-dashed text-xs md:text-sm font-medium">
              追加できる絞り込み条件はありません
            </div>
          )
        )}

        {filteredVideos.length === 0 ? (
          <div className="text-center text-muted mt-16 py-12 bg-card rounded-2xl border border-border">
            <p className="text-lg">「{combinedSearchQuery}」に一致する動画は見つかりませんでした。</p>
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
                  onTagClick={handleTagClick}
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

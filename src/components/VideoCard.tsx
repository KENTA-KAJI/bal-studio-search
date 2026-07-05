import React, { useState, useEffect, useMemo } from "react";
import videosData from "@/data/videos.json";
import coursesData from "@/data/courses.json";
import { RatingBadge, RatingInput } from "@/components/StarRating";

const SYNONYMS: Record<string, string[]> = {
  "中殿筋": ["中臀筋", "中殿筋"],
  "中臀筋": ["中臀筋", "中殿筋"],
  "大殿筋": ["大臀筋", "大殿筋"],
  "大臀筋": ["大臀筋", "大殿筋"],
  "ハムストリング": ["ハムストリング", "ハムストリングス"],
  "ハムストリングス": ["ハムストリング", "ハムストリングス"],
  "ローテーターカフ": ["ローテーターカフ", "ローテータカフ"],
  "ローテータカフ": ["ローテーターカフ", "ローテータカフ"]
};

const normalizeTags = (tags: string[]): string[] => {
  const result = new Set<string>();
  tags.forEach(rawTag => {
    if (typeof rawTag !== "string") return;
    const parts = rawTag.split(/[,，、]/);
    parts.forEach(part => {
      const cleaned = part.trim();
      if (cleaned) {
        result.add(cleaned);
      }
    });
  });
  return Array.from(result);
};

const isTagMatchingSelection = (tag: string, selectedTags: string[]) => {
  return selectedTags.some(selTag => {
    const normSelected = selTag.toLowerCase();
    const group = SYNONYMS[selTag];
    if (group) {
      const lowercaseGroup = group.map(g => g.toLowerCase());
      return lowercaseGroup.includes(tag.toLowerCase());
    }
    return tag.toLowerCase() === normSelected;
  });
};

export interface CourseData {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: string;
  description: string;
  commonTags: string[];
  recommendedFor: string;
  series?: string;
  subSeries?: string;
  sortOrder?: string;
  setId?: string;
}

export interface VideoData {
  id: string;
  courseId: string;
  title: string;
  duration: string;
  videoDescription: string;
  individualTags: string[];
  thumbnailUrl: string;
  videogUrl: string;
  status: string;
}

const VideoCard = React.memo(function VideoCard({
  video,
  course,
  onTagClick,
  selectedTags = [],
  relatedVideos: relatedVideosProp,
  ratingSummary,
  myRating,
  onRate
}: {
  video: VideoData;
  course: CourseData;
  onTagClick?: (tag: string) => void;
  selectedTags?: string[];
  relatedVideos?: VideoData[];
  ratingSummary?: { average: number; count: number };
  myRating?: number;
  onRate?: (courseId: string, rating: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgHasError, setImgHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const seriesVal = course?.series || "";
  const subSeriesVal = course?.subSeries || "";
  const showAutoThumbnail = !video.thumbnailUrl || imgHasError;
  const isNext = seriesVal === "NEXT（短編コンテンツ）" || seriesVal === "NEXT";

  const currentSetId = course?.setId || "";
  const relatedVideos = useMemo(() => {
    if (relatedVideosProp) return relatedVideosProp;
    if (!isModalOpen || !isNext || !currentSetId) return [];
    
    // Fallback if not passed: filter and sort
    const publicVids = videosData.filter(v => v.status !== "非公開" && v.status !== "準備中") as VideoData[];
    const filtered = publicVids.filter(v => {
      const c = coursesData.find(c => c.id === v.courseId);
      return c && c.setId === currentSetId;
    });

    return [...filtered].sort((a, b) => {
      const courseA = coursesData.find(c => c.id === a.courseId);
      const courseB = coursesData.find(c => c.id === b.courseId);
      const orderA = courseA && courseA.sortOrder ? parseInt(courseA.sortOrder, 10) : null;
      const orderB = courseB && courseB.sortOrder ? parseInt(courseB.sortOrder, 10) : null;
      if (orderA !== null && orderB !== null) return orderA - orderB;
      if (orderA !== null) return -1;
      if (orderB !== null) return 1;
      const indexA = videosData.findIndex(v => v.id === a.id);
      const indexB = videosData.findIndex(v => v.id === b.id);
      return indexA - indexB;
    });
  }, [relatedVideosProp, isModalOpen, isNext, currentSetId]);

  const sortedRelatedVideos = relatedVideos;

  // Modal event listeners
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Tag display rule:
  const activeSelections = selectedTags || [];
  const cleanIndividual = normalizeTags(video.individualTags || []);
  const cleanCommon = normalizeTags(course?.commonTags || []);

  // Group 1: Selected matching tags
  const matchedTags = [
    ...cleanIndividual.filter(t => isTagMatchingSelection(t, activeSelections)),
    ...cleanCommon.filter(t => isTagMatchingSelection(t, activeSelections))
  ];
  const uniqueMatched = Array.from(new Set(matchedTags));

  // Group 2: Other individual tags
  const otherIndividual = cleanIndividual.filter(t => !isTagMatchingSelection(t, activeSelections));

  // Group 3: Other common tags
  const otherCommon = cleanCommon.filter(t => !isTagMatchingSelection(t, activeSelections));

  // Combine by priority
  const cardTags = Array.from(new Set([
    ...uniqueMatched,
    ...otherIndividual,
    ...otherCommon
  ]));

  const standardBaseTags = Array.from(new Set([
    course?.category,
    course?.level,
    ...cleanIndividual,
    ...cleanCommon
  ].filter(Boolean)));

  const matchedStandard = standardBaseTags.filter(t => isTagMatchingSelection(t, activeSelections));
  const otherStandard = standardBaseTags.filter(t => !isTagMatchingSelection(t, activeSelections));

  const allUniqueDisplayTags = isNext
    ? cardTags
    : [...matchedStandard, ...otherStandard];

  // For collapsed view, keep a limit (e.g. 8)
  const finalDisplayTags = allUniqueDisplayTags.slice(0, 8);
  const tagsToDisplay = isExpanded ? allUniqueDisplayTags : finalDisplayTags;
  const hiddenCount = allUniqueDisplayTags.length - finalDisplayTags.length;

  if (isNext) {
    const nextTags = cardTags.slice(0, 3);

    return (
      <>
        <div className="flex flex-col justify-between p-5 bg-card rounded-2xl border border-border group hover:border-accent transition-colors duration-300 h-full">
          <div>
            {/* Header Area: Series & Subseries (left), Duration (right) */}
            <div className="flex items-center justify-between w-full gap-2 mb-3">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {seriesVal && (
                  <span className="px-2 py-0.5 rounded border border-accent/40 bg-accent/5 text-accent text-[9px] font-bold tracking-wider truncate">
                    {seriesVal}
                  </span>
                )}
                {subSeriesVal && (
                  <span className="px-2 py-0.5 rounded border border-border/60 bg-white/5 text-foreground/90 text-[9px] font-medium tracking-wider truncate">
                    {subSeriesVal}
                  </span>
                )}
              </div>
              {video.duration && (
                <span className="shrink-0 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white border border-border/40">
                  {video.duration}
                </span>
              )}
            </div>

            {/* Title Area */}
            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 h-[3.5rem] leading-snug select-none">
              {video.title}
            </h3>

            {/* Instructor Area */}
            <div className="text-xs text-muted mb-2 select-none">
              {course?.instructor || "講師未定"}
            </div>

            {/* Rating Area */}
            {course?.id && (
              <div className="flex flex-col gap-1 mb-3">
                <RatingBadge
                  average={ratingSummary?.average ?? 0}
                  count={ratingSummary?.count ?? 0}
                />
                {onRate && course?.id && (
                  <RatingInput myRating={myRating} onRate={(rating) => onRate(course.id, rating)} />
                )}
              </div>
            )}

            {/* Tags Area */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {nextTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick?.(tag)}
                  className="text-[10px] px-2 py-0.5 bg-background text-muted rounded border border-border whitespace-nowrap hover:border-accent/40 hover:text-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button Section */}
          <div>
            {sortedRelatedVideos.length >= 2 ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-[40%] text-center py-2.5 rounded-xl bg-black border border-accent text-accent font-bold text-sm hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  セットで見る
                </button>
                {video.videogUrl ? (
                  <a
                    href={video.videogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full sm:w-[60%] text-center py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors"
                  >
                    視聴する
                  </a>
                ) : (
                  <button
                    disabled
                    className="block w-full sm:w-[60%] text-center py-2.5 rounded-xl bg-background border border-border text-muted font-bold text-sm cursor-not-allowed"
                  >
                    準備中
                  </button>
                )}
              </div>
            ) : (
              video.videogUrl ? (
                <a
                  href={video.videogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors"
                >
                  視聴する
                </a>
              ) : (
                <button
                  disabled
                  className="block w-full text-center py-2.5 rounded-xl bg-background border border-border text-muted font-bold text-sm cursor-not-allowed"
                >
                  準備中
                </button>
              )
            )}
          </div>
        </div>

        {/* Modal Overlay / Bottom Sheet */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/75 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative bg-[#121212] border-t sm:border border-border/80 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-accent font-bold tracking-wider px-2 py-0.5 rounded border border-accent/30 bg-accent/5">
                      セットで見る
                    </span>
                    <span className="text-xs text-muted">全 {sortedRelatedVideos.length} 本</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">
                    選択中の動画: {video.title}
                  </h4>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-foreground p-1 text-2xl font-bold cursor-pointer transition-colors"
                  aria-label="閉じる"
                >
                  &times;
                </button>
              </div>

              {/* Content / Related Videos list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {sortedRelatedVideos.map((rVideo) => {
                  const rCourse = coursesData.find(c => c.id === rVideo.courseId);
                  const isCurrent = rVideo.id === video.id;
                  const rTags = Array.from(new Set(rVideo.individualTags || [])).slice(0, 2);

                  return (
                    <div 
                      key={rVideo.id} 
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        isCurrent 
                          ? "border-accent/40 bg-accent/5" 
                          : "border-border/60 bg-card/40 hover:bg-card/75"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {isCurrent && (
                              <span className="text-[10px] bg-accent text-black font-bold px-1.5 py-0.5 rounded">
                                選択中
                              </span>
                            )}
                            {rCourse?.subSeries && (
                              <span className="text-[10px] bg-white/5 border border-border/60 text-foreground/80 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                                {rCourse.subSeries}
                              </span>
                            )}
                            {rVideo.duration && (
                              <span className="text-[10px] text-muted font-mono bg-black/40 px-1.5 py-0.5 rounded border border-border/20">
                                {rVideo.duration}
                              </span>
                            )}
                          </div>
                          
                          <h5 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 leading-snug">
                            {rVideo.title}
                          </h5>
                          
                          <p className="text-xs text-muted mb-2">
                            {rCourse?.instructor || "講師未定"}
                          </p>

                          {rTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {rTags.map(tag => (
                                <span 
                                  key={tag}
                                  className="text-[9px] bg-background text-muted border border-border/80 px-1.5 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {rVideo.videogUrl ? (
                            <a
                              href={rVideo.videogUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-center px-4 py-2 rounded-lg bg-accent text-black font-bold text-xs hover:bg-accent/90 transition-colors w-full md:w-auto cursor-pointer"
                            >
                              視聴する
                            </a>
                          ) : (
                            <button
                              disabled
                              className="text-center px-4 py-2 rounded-lg bg-background border border-border text-muted font-bold text-xs cursor-not-allowed w-full md:w-auto"
                            >
                              準備中
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden bg-card rounded-2xl border border-border group hover:border-accent transition-colors duration-300 h-full">
      <div className="relative aspect-video w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c0c0c] to-[#1c1c1c] border-b border-border overflow-hidden select-none">
        {!showAutoThumbnail ? (
          <img 
            src={video.thumbnailUrl} 
            alt="" 
            onError={() => setImgHasError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-4.5 text-left bg-gradient-to-br from-[#0b0b0b] to-[#1a1a1a] group-hover:from-[#0d0d0d] group-hover:to-[#1e1e1e] transition-all duration-500">
            {/* Top Label Area */}
            {(seriesVal || subSeriesVal) ? (
              <div className="flex flex-col gap-1 items-start z-10">
                {seriesVal && (
                  <span className="px-2 py-0.5 rounded border border-accent/40 bg-accent/5 text-accent text-[9px] font-bold tracking-wider uppercase">
                    {seriesVal}
                  </span>
                )}
                {subSeriesVal && (
                  <span className="px-2 py-0.5 rounded border border-border/60 bg-white/5 text-foreground/90 text-[9px] font-medium tracking-wider">
                    {subSeriesVal}
                  </span>
                )}
              </div>
            ) : (
              <div />
            )}
            
            {isNext ? (
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="relative w-16 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border border-accent/25 bg-background" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-end mt-2">
                <div className="text-sm sm:text-base font-bold text-foreground leading-snug max-w-full line-clamp-3 select-none">
                  {video.title || course?.title}
                </div>

                {/* Decorative gold line at the bottom of the title */}
                <div className="w-8 h-[2px] bg-accent/40 mt-2.5 rounded group-hover:w-12 transition-all duration-300" />
              </div>
            )}
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-white z-10">
            {video.duration}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className={`text-lg font-semibold text-foreground mb-2 line-clamp-2 ${isNext ? "h-[3.5rem]" : ""}`}>
          {video.title}
        </h3>
        <div className="text-xs text-muted mb-1 flex items-center gap-2">
          <span>{course?.instructor || "講師未定"}</span>
          {isNext ? (
            subSeriesVal && (
              <>
                <span className="w-1 h-1 bg-muted rounded-full"></span>
                <span>{subSeriesVal}</span>
              </>
            )
          ) : (
            <>
              <span className="w-1 h-1 bg-muted rounded-full"></span>
              <span>{course?.category || "未分類"}</span>
            </>
          )}
        </div>
        {!isNext && video.duration && (
          <div className="text-[10px] text-muted/70 mb-3">
            総再生時間：{video.duration}
          </div>
        )}

        {/* Rating Area */}
        {course?.id && (
          <div className="flex flex-col gap-1 mb-3">
            <RatingBadge average={ratingSummary?.average ?? 0} count={ratingSummary?.count ?? 0} />
            {onRate && course?.id && (
              <RatingInput myRating={myRating} onRate={(rating) => onRate(course.id, rating)} />
            )}
          </div>
        )}

        <div className={`mt-auto flex flex-wrap gap-1.5 mb-4 ${isExpanded ? "" : "max-h-[64px] overflow-hidden"}`}>
          {tagsToDisplay.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className="text-[10px] px-2 py-0.5 bg-background text-muted rounded border border-border whitespace-nowrap hover:border-accent/40 hover:text-foreground transition-colors"
            >
              {tag}
            </button>
          ))}
          {!isExpanded && hiddenCount > 0 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[10px] px-1.5 py-0.5 bg-background text-accent/70 rounded border border-accent/20 whitespace-nowrap font-medium hover:bg-accent/10 transition-colors"
            >
              +{hiddenCount}
            </button>
          )}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[10px] px-1.5 py-0.5 bg-background text-accent/70 rounded border border-accent/20 whitespace-nowrap font-medium hover:bg-accent/10 transition-colors"
            >
              閉じる
            </button>
          )}
        </div>

        {video.videogUrl ? (
          <a
            href={video.videogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            視聴する
          </a>
        ) : (
          <button
            disabled
            className="block w-full text-center py-2.5 rounded-xl bg-background border border-border text-muted font-bold text-sm cursor-not-allowed"
          >
            準備中
          </button>
        )}
      </div>
    </div>
  );
});

export default VideoCard;

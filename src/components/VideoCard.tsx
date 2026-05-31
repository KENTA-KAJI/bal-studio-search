import { useState } from "react";

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
  sortOrder?: string;
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

export default function VideoCard({ 
  video, 
  course, 
  onTagClick 
}: { 
  video: VideoData; 
  course: CourseData;
  onTagClick?: (tag: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgHasError, setImgHasError] = useState(false);

  // Helper to extract lecture type (WEAPON, THINKING, BUSINESS, etc.)
  const getLectureType = () => {
    const lectureTypes = ["WEAPON講義", "THINKING講義", "BUSINESS講義", "外部講師講義"];
    
    // Check in properties
    for (const val of Object.values(course || {})) {
      if (typeof val === "string" && lectureTypes.includes(val)) return val;
    }
    for (const val of Object.values(video || {})) {
      if (typeof val === "string" && lectureTypes.includes(val)) return val;
    }

    // Check tags
    const foundInCourse = course?.commonTags?.find(tag => lectureTypes.includes(tag));
    if (foundInCourse) return foundInCourse;

    const foundInVideo = video?.individualTags?.find(tag => lectureTypes.includes(tag));
    if (foundInVideo) return foundInVideo;

    return undefined;
  };

  // Helper to extract series name (NEXT, LIVE SESSION, etc.)
  const getSeriesName = () => {
    const seriesNames = ["NEXT", "LIVE SESSION", "プロトレーナー研究所", "長編コンテンツ"];
    
    // Direct property check
    if (course?.series) {
      const match = seriesNames.find(s => course.series?.includes(s));
      if (match) return match;
    }

    // Unknown property check
    for (const val of Object.values(course || {})) {
      if (typeof val === "string" && seriesNames.some(s => val.includes(s))) {
        return seriesNames.find(s => val.includes(s));
      }
    }

    // Tags check
    const foundInCourse = course?.commonTags?.find(tag => seriesNames.some(s => tag.includes(s)));
    if (foundInCourse) return seriesNames.find(s => foundInCourse.includes(s));

    const foundInVideo = video?.individualTags?.find(tag => seriesNames.some(s => tag.includes(s)));
    if (foundInVideo) return seriesNames.find(s => foundInVideo.includes(s));

    return undefined;
  };

  const lectureType = getLectureType();
  const seriesName = getSeriesName();
  const showAutoThumbnail = !video.thumbnailUrl || imgHasError;

  // Tag display rule:
  // 1. Courses category
  // 2. Courses level
  // 3. Videos individualTags
  // (commonTags and recommendedFor are used for search but not displayed here)
  const allUniqueDisplayTags = Array.from(new Set([
    course?.category,
    course?.level,
    ...(video?.individualTags || [])
  ].filter(Boolean)));

  // For collapsed view, keep a limit (e.g. 8)
  const finalDisplayTags = allUniqueDisplayTags.slice(0, 8);
  const tagsToDisplay = isExpanded ? allUniqueDisplayTags : finalDisplayTags;
  const hiddenCount = allUniqueDisplayTags.length - finalDisplayTags.length;

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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#0b0b0b] to-[#1a1a1a] group-hover:from-[#0d0d0d] group-hover:to-[#1e1e1e] transition-all duration-500">
            {/* Label at the top */}
            {(lectureType || seriesName) ? (
              <div className="absolute top-3 px-2 py-0.5 rounded border border-accent/40 bg-accent/5 text-accent text-[9px] font-bold tracking-wider uppercase">
                {lectureType || seriesName}
              </div>
            ) : (
              <div className="absolute top-3 text-[9px] font-bold tracking-[0.25em] text-muted/40 uppercase">
                BAL STUDIO
              </div>
            )}
            
            {/* Title in the center */}
            <div className="text-xs sm:text-sm font-bold text-foreground leading-snug max-w-full px-2 mt-4 line-clamp-3 select-none">
              {video.title || course?.title}
            </div>

            {/* Decorative gold line at the bottom of the title */}
            <div className="w-8 h-[2px] bg-accent/40 mt-3 rounded group-hover:w-12 transition-all duration-300" />
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-white z-10">
            {video.duration}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
          {video.title}
        </h3>
        <div className="text-xs text-muted mb-1 flex items-center gap-2">
          <span>{course?.instructor || "講師未定"}</span>
          <span className="w-1 h-1 bg-muted rounded-full"></span>
          <span>{course?.category || "未分類"}</span>
        </div>
        {video.duration && (
          <div className="text-[10px] text-muted/70 mb-4">
            総再生時間：{video.duration}
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
}

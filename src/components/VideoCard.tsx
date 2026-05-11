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
      <div className="relative aspect-video w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#050505] to-[#1a1a1a] border-b border-border overflow-hidden">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            <span className="text-xl font-bold tracking-widest text-accent/80 group-hover:scale-105 transition-transform duration-500">
              BAL STUDIO
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em] text-muted/60 mt-1">
              VIDEO LESSON
            </span>
          </>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-white">
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

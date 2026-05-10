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

export default function VideoCard({ video, course }: { video: VideoData; course: CourseData }) {
  // Tag Priority Logic:
  // 1. category
  // 2. level
  // 3. individualTags (max 3)
  // 4. commonTags (max 3)
  const displayTags: string[] = [];
  if (course?.category) displayTags.push(course.category);
  if (course?.level) displayTags.push(course.level);
  
  const iTags = (video?.individualTags || []).filter(t => !displayTags.includes(t));
  displayTags.push(...iTags.slice(0, 3));
  
  const cTags = (course?.commonTags || []).filter(t => !displayTags.includes(t));
  displayTags.push(...cTags.slice(0, 3));

  // Final limit (though priority logic already caps it around 8)
  const finalDisplayTags = displayTags.slice(0, 8);

  // Calculate hidden count (from unique pool of individual + common tags)
  const allUniqueTags = Array.from(new Set([...(video?.individualTags || []), ...(course?.commonTags || [])]));
  const hiddenCount = allUniqueTags.filter(t => !finalDisplayTags.includes(t)).length;


  return (
    <div className="flex flex-col overflow-hidden bg-card rounded-2xl border border-border group hover:border-accent transition-colors duration-300">
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
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono text-white">
          {video.duration}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs text-accent font-medium tracking-wider uppercase line-clamp-1">
            {course?.title || "Unknown Course"}
          </div>
          <div className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded ml-2 whitespace-nowrap">
            {course?.level || "-"}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-2">
          {video.title}
        </h3>
        <div className="text-xs text-muted mb-4 flex items-center gap-2">
          <span>{course?.instructor || "講師未定"}</span>
          <span className="w-1 h-1 bg-muted rounded-full"></span>
          <span>{course?.category || "未分類"}</span>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5 mb-2 overflow-hidden max-h-[64px]">
          {finalDisplayTags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-background text-muted rounded border border-border whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-background text-accent/70 rounded border border-accent/20 whitespace-nowrap font-medium">
              +{hiddenCount}
            </span>
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

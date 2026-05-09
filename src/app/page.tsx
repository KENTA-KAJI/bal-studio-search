"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import VideoCard, { VideoData, CourseData } from "@/components/VideoCard";

// Import dummy data
import coursesData from "@/data/courses.json";
import videosData from "@/data/videos.json";

function SearchContent() {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";

  // Process data
  const filteredVideos = useMemo(() => {
    // Filter out non-public videos
    const publicVideos = videosData.filter(v => v.status !== "非公開" && v.status !== "準備中");

    if (!query.trim()) return publicVideos as VideoData[];

    const lowerQuery = query.toLowerCase();
    return (publicVideos as VideoData[]).filter((video) => {
      const course = coursesData.find((c) => c.id === video.courseId) as unknown as CourseData;
      
      const courseText = [
        course?.title,
        course?.instructor,
        course?.category,
        course?.level,
        course?.description,
        ...(course?.commonTags || []),
        course?.recommendedFor
      ].filter(Boolean).join(" ").toLowerCase();

      const videoText = [
        video.title,
        video.videoDescription,
        ...(video.individualTags || [])
      ].filter(Boolean).join(" ").toLowerCase();

      return courseText.includes(lowerQuery) || videoText.includes(lowerQuery);
    });
  }, [query]);

  return (
    <div className={`min-h-screen bg-background text-foreground ${isEmbed ? "px-4 pt-2 pb-6" : "p-8 md:p-12"}`}>
      {!isEmbed && (
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            BAL STUDIO <span className="text-accent">Search</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            BAL STUDIO内の講義・動画を、分野・目的・キーワードから検索できます。
          </p>
        </header>
      )}

      <main className="max-w-7xl mx-auto">
        <SearchBar 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          className={isEmbed ? "mb-4" : "mb-8"}
        />

        {filteredVideos.length === 0 ? (
          <div className="text-center text-muted mt-16 py-12 bg-card rounded-2xl border border-border">
            <p className="text-lg">「{query}」に一致する動画は見つかりませんでした。</p>
            <p className="mt-2 text-sm">別のキーワードをお試しください。</p>
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

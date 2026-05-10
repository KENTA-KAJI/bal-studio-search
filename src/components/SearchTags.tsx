"use client";

import React from "react";

interface TagCategory {
  title: string;
  tags: string[];
}

interface SearchTagsProps {
  categories: TagCategory[];
  selectedTag: string;
  onTagClick: (tag: string) => void;
  isEmbed?: boolean;
}

const SearchTags: React.FC<SearchTagsProps> = ({ 
  categories, 
  selectedTag, 
  onTagClick, 
  isEmbed = false 
}) => {
  return (
    <div className={`space-y-4 ${isEmbed ? "mb-6" : "mb-10"}`}>
      {categories.map((category) => (
        <div key={category.title} className={isEmbed ? "space-y-1.5" : "space-y-2.5"}>
          <h2 className={`text-accent font-semibold tracking-wider ${isEmbed ? "text-[10px]" : "text-xs"}`}>
            【{category.title}】
          </h2>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {category.tags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick(isActive ? "" : tag)}
                  className={`
                    px-2.5 py-1 rounded-md transition-all duration-200 border
                    ${isEmbed ? "text-[10px]" : "text-xs"}
                    ${isActive 
                      ? "bg-accent/20 border-accent text-accent font-semibold shadow-[0_0_8px_rgba(214,180,106,0.2)]" 
                      : "bg-card border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
                    }
                  `}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchTags;

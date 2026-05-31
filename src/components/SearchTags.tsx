"use client";

import React, { useState, useEffect } from "react";

interface TagCategory {
  title: string;
  tags: string[];
}

interface SearchTagsProps {
  categories: TagCategory[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  isEmbed?: boolean;
  getCategoryTitle?: (tag: string) => string;
}

const SearchTags: React.FC<SearchTagsProps> = ({ 
  categories, 
  selectedTags = [], 
  onTagClick, 
  isEmbed = false,
  getCategoryTitle
}) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Automatically expand categories containing selected tags
  useEffect(() => {
    if (selectedTags.length > 0 && getCategoryTitle) {
      setOpenCategories(prev => {
        const next = { ...prev };
        let updated = false;
        selectedTags.forEach(tag => {
          const title = getCategoryTitle(tag);
          if (title && !next[title]) {
            next[title] = true;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }
  }, [selectedTags, getCategoryTitle]);

  const toggleCategory = (title: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Filter out sections that have no tags to display
  const visibleCategories = categories.filter(cat => cat.tags.length > 0);

  return (
    <div className={`space-y-3 ${isEmbed ? "mb-6" : "mb-10"}`}>
      {visibleCategories.map((category) => {
        const isOpen = !!openCategories[category.title];
        return (
          <div 
            key={category.title} 
            className={`
              border border-border/40 rounded-2xl overflow-hidden transition-all duration-300
              ${isOpen ? "bg-card/30 border-border/80" : "bg-card/15 hover:bg-card/25 hover:border-border/60"}
            `}
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full flex items-center justify-between py-4 px-5 text-left font-bold text-foreground focus:outline-none select-none cursor-pointer"
            >
              <span className={isEmbed ? "text-xs text-accent" : "text-sm text-accent font-bold"}>
                {category.title}
              </span>
              <svg 
                className={`w-4 h-4 text-muted/60 transition-transform duration-300 ${isOpen ? "rotate-180 text-accent" : ""}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Accordion Content */}
            {isOpen && (
              <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    const isPurposeTag = category.title === "目的から探す";
                    return (
                      <button
                        key={tag}
                        onClick={() => onTagClick(tag)}
                        className={`
                          rounded-lg transition-all duration-200 border text-xs font-medium cursor-pointer
                          ${isPurposeTag 
                            ? "w-full sm:w-auto text-left py-2.5 sm:py-1.5 px-4 sm:px-3" 
                            : "px-3 py-1.5 text-center"
                          }
                          ${isActive 
                            ? "bg-accent/20 border-accent text-accent font-semibold shadow-[0_0_8px_rgba(214,180,106,0.2)]" 
                            : "bg-background border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
                          }
                        `}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SearchTags;


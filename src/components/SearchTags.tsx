import React, { useState, useEffect, useRef, useCallback } from "react";
import { tagCategories } from "@/data/tagCategories";
import nextTagCategoriesData from "@/data/nextTagCategories.json";

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

const matchTagNameWithSynonyms = (tagName: string, searchWord: string) => {
  const normTag = tagName.toLowerCase();
  const normQuery = searchWord.toLowerCase();
  
  if (normTag.includes(normQuery)) return true;
  
  for (const [key, group] of Object.entries(SYNONYMS)) {
    const matchesQuery = key.toLowerCase().includes(normQuery) || group.some(g => g.toLowerCase().includes(normQuery));
    if (matchesQuery) {
      if (group.some(g => g.toLowerCase() === normTag)) {
        return true;
      }
    }
  }
  return false;
};

// nextTagCategoriesの型
interface NextTagCategoryEntry {
  category: string;
  displayOrder: number;
  tag: string;
}
const nextTagCategories: NextTagCategoryEntry[] = nextTagCategoriesData as NextTagCategoryEntry[];

const NEXT_SUB_SERIES = ["解剖学", "栄養学", "コンディショニング"];

// NEXTカテゴリタブの順序
const NEXT_TAG_CATEGORY_ORDER = [
  "すべて",
  "部位",
  "骨・筋・関節・組織",
  "症状・悩み",
  "動作・トレーニング",
  "コンディショニング・施術",
  "栄養・健康",
  "指導・ビジネス",
  "その他"
];

const BODY_THEME_CATEGORIES = [
  "すべて",
  "部位",
  "骨・筋・関節・組織",
  "症状・悩み",
  "動作・トレーニング",
  "コンディショニング・施術",
  "栄養・健康",
  "指導・ビジネス",
  "その他"
];

// シンプルタグボタン（NEXT分野・長編テーマ共通）
function SimpleTagButton({ tag, isActive, onClick }: { tag: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-lg transition-all duration-200 border text-xs font-medium cursor-pointer px-3 py-1.5 text-center
        ${isActive
          ? "bg-accent/20 border-accent text-accent font-semibold shadow-[0_0_8px_rgba(214,180,106,0.2)]"
          : "bg-background border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
        }
      `}
    >
      {tag}
    </button>
  );
}

const BODY_THEME_CATEGORIES_LABELS = BODY_THEME_CATEGORIES;

const SearchTagsComponent: React.FC<SearchTagsProps> = ({ 
  categories, 
  selectedTags = [], 
  onTagClick, 
  isEmbed = false,
  getCategoryTitle
}) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isBodyThemeExpanded, setIsBodyThemeExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [maxDisplayCount, setMaxDisplayCount] = useState(100);

  // Reset maxDisplayCount on tab or search query changes
  useEffect(() => {
    setMaxDisplayCount(100);
  }, [selectedCategory, tagSearchQuery]);

  // Tabs scroll & drag functionality
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftGrad, setShowLeftGrad] = useState(false);
  const [showRightGrad, setShowRightGrad] = useState(false);
  
  // Track previous NEXT fields for auto-expansion
  const prevNextSubSeriesRef = useRef<string[]>([]);

  const handleScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftGrad(scrollLeft > 2);
    setShowRightGrad(scrollWidth - scrollLeft - clientWidth > 2);
  }, []);

  useEffect(() => {
    if (isBodyThemeExpanded) {
      // Delay slightly for DOM rendering
      const timer = setTimeout(() => {
        handleScroll();
      }, 55);
      return () => clearTimeout(timer);
    }
  }, [isBodyThemeExpanded, handleScroll, categories, selectedCategory, selectedTags]);

  // Drag-to-scroll refs & callbacks
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    startXRef.current = e.pageX - e.currentTarget.offsetLeft;
    scrollLeftRef.current = e.currentTarget.scrollLeft;
    e.currentTarget.style.cursor = "grabbing";
    e.currentTarget.style.userSelect = "none";
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = false;
    e.currentTarget.style.cursor = "default";
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = false;
    e.currentTarget.style.cursor = "default";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    e.currentTarget.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  // Auto-expand inner "部位・テーマから探す" when NEXT fields are selected or changed
  useEffect(() => {
    const isNextSelected = selectedTags.includes("NEXT（短編コンテンツ）");
    const currentNextSubSeries = selectedTags.filter(tag => NEXT_SUB_SERIES.includes(tag));

    if (isNextSelected && currentNextSubSeries.length > 0) {
      const prev = prevNextSubSeriesRef.current;
      const hasChanged = JSON.stringify([...currentNextSubSeries].sort()) !== JSON.stringify([...prev].sort());
      if (hasChanged) {
        setIsBodyThemeExpanded(true);
        setSelectedCategory("すべて");
      }
    }
    prevNextSubSeriesRef.current = currentNextSubSeries;
  }, [selectedTags]);

  // Reset selected category to "すべて" if the category is no longer available
  useEffect(() => {
    const bodyThemeCategory = categories.find(cat => cat.title === "部位・テーマから探す");
    if (bodyThemeCategory && selectedCategory !== "すべて") {
      const isNextBodyTags = bodyThemeCategory.tags.length > 0 &&
        nextTagCategories.some(tc => tc.tag === bodyThemeCategory.tags[0]);
      const catData = isNextBodyTags ? nextTagCategories : tagCategories;
      
      const selectedNextSubSeries = selectedTags.filter(t => NEXT_SUB_SERIES.includes(t));
      
      const tabTags = ((bodyThemeCategory as any).tabTags || bodyThemeCategory.tags).filter(
        (t: string) => !selectedNextSubSeries.includes(t)
      );
      
      const hasAnyTag = tabTags.some((tag: string) => {
        const entry = catData.find(tc => tc.tag === tag);
        return entry?.category === selectedCategory;
      });
      
      if (!hasAnyTag) {
        setSelectedCategory("すべて");
      }
    }
  }, [categories, selectedCategory, selectedTags]);

  // Automatically expand categories containing selected tags, or on auto-expand triggers
  useEffect(() => {
    if (getCategoryTitle) {
      setOpenCategories(prev => {
        const next = { ...prev };
        let updated = false;

        if (selectedTags.length > 0) {
          selectedTags.forEach(tag => {
            const title = getCategoryTitle(tag);
            if (title && !next[title]) {
              next[title] = true;
              updated = true;
            }
          });
        }

        // Auto-expand "テーマから探す" when "長編コンテンツ" is selected
        if (selectedTags.includes("長編コンテンツ") && !next["テーマから探す"]) {
          next["テーマから探す"] = true;
          updated = true;
        }

        // Auto-expand "部位・テーマから探す" when a NEXT sub-series is selected
        const NEXT_SUB_SERIES = ["解剖学", "栄養学", "コンディショニング"];
        const hasNextSubSeries = selectedTags.some(tag => NEXT_SUB_SERIES.includes(tag));
        if (hasNextSubSeries && !next["部位・テーマから探す"]) {
          next["部位・テーマから探す"] = true;
          updated = true;
        }

        return updated ? next : prev;
      });
    }
  }, [selectedTags, getCategoryTitle]);

  // Scroll to newly expanded categories if out of view
  const lastExpandedCategoryRef = useRef<string | null>(null);

  useEffect(() => {
    let newlyOpenedCategory: string | null = null;
    const NEXT_SUB_SERIES = ["解剖学", "栄養学", "コンディショニング"];
    const hasNextSubSeries = selectedTags.some(tag => NEXT_SUB_SERIES.includes(tag));

    if (selectedTags.includes("長編コンテンツ")) {
      newlyOpenedCategory = "テーマから探す";
    } else if (selectedTags.includes("NEXT（短編コンテンツ）")) {
      if (hasNextSubSeries) {
        newlyOpenedCategory = "部位・テーマから探す";
      } else {
        newlyOpenedCategory = "NEXTの分野から探す";
      }
    }

    if (newlyOpenedCategory && newlyOpenedCategory !== lastExpandedCategoryRef.current) {
      lastExpandedCategoryRef.current = newlyOpenedCategory;

      setTimeout(() => {
        let elementId = "";
        if (newlyOpenedCategory === "テーマから探す") {
          elementId = "category-theme-container";
        } else if (newlyOpenedCategory === "NEXTの分野から探す") {
          elementId = "category-next-sub-container";
        } else if (newlyOpenedCategory === "部位・テーマから探す") {
          elementId = "category-body-theme-container";
        }

        if (elementId) {
          const el = document.getElementById(elementId);
          if (el) {
            const rect = el.getBoundingClientRect();
            const isOutOfView = rect.top < 0 || rect.bottom > window.innerHeight;
            if (isOutOfView) {
              el.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
              });
            }
          }
        }
      }, 100);
    }

    const hasSeries = selectedTags.some(tag => ["長編コンテンツ", "NEXT（短編コンテンツ）"].includes(tag));
    if (!hasSeries) {
      lastExpandedCategoryRef.current = null;
    }
  }, [selectedTags]);

  const toggleCategory = (title: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const visibleCategories = categories.filter(cat => cat.tags.length > 0);

  return (
    <div className={`space-y-3 ${isEmbed ? "mb-6" : "mb-10"}`}>
      {visibleCategories.map((category) => {
        const isOpen = !!openCategories[category.title];

        // ── NEXTの分野から探す：常時展開シンプルボタン
        if (category.title === "NEXTの分野から探す") {
          return (
            <div key={category.title} id="category-next-sub-container" className="border border-border/40 rounded-2xl overflow-hidden bg-card/15">
              <div className="py-4 px-5">
                <span className={isEmbed ? "text-xs text-accent font-bold" : "text-sm text-accent font-bold"}>
                  {category.title}
                </span>
              </div>
              <div className="px-5 pb-5 pt-0">
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => (
                    <SimpleTagButton
                      key={tag}
                      tag={tag}
                      isActive={selectedTags.includes(tag)}
                      onClick={() => onTagClick(tag)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // ── テーマから探す（長編コンテンツ専用）：アコーディオン+シンプルボタン
        if (category.title === "テーマから探す") {
          return (
            <div
              key={category.title}
              id="category-theme-container"
              className={`border border-border/40 rounded-2xl overflow-hidden transition-all duration-300
                ${isOpen ? "bg-card/30 border-border/80" : "bg-card/15 hover:bg-card/25 hover:border-border/60"}`}
            >
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between py-4 px-5 text-left font-bold text-foreground focus:outline-none select-none cursor-pointer"
              >
                <span className={isEmbed ? "text-xs text-accent" : "text-sm text-accent font-bold"}>
                  {category.title}
                </span>
                <svg className={`w-4 h-4 text-muted/60 transition-transform duration-300 ${isOpen ? "rotate-180 text-accent" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <SimpleTagButton
                        key={tag}
                        tag={tag}
                        isActive={selectedTags.includes(tag)}
                        onClick={() => onTagClick(tag)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // ── 部位・テーマから探す：展開UI（NEXT分野選択後 or 通常）
        if (category.title === "部位・テーマから探す") {
          // タグがnextTagCategoriesに含まれるかでNEXT判定
          const isNextBodyTags = category.tags.length > 0 &&
            nextTagCategories.some(tc => tc.tag === category.tags[0]);
          const catData = isNextBodyTags ? nextTagCategories : tagCategories;
          const categoryOrderList = isNextBodyTags ? NEXT_TAG_CATEGORY_ORDER : BODY_THEME_CATEGORIES_LABELS;

          const selectedNextSubSeries = selectedTags.filter(t => NEXT_SUB_SERIES.includes(t));
          const displayTags = category.tags.filter(tag => !selectedNextSubSeries.includes(tag));
          const tabTags = ((category as any).tabTags || category.tags).filter((tag: string) => !selectedNextSubSeries.includes(tag));

          const availableCategoryTabs = categoryOrderList.filter(cat => {
            if (cat === "すべて") return true;
            return tabTags.some((tag: string) => {
              const entry = catData.find(tc => tc.tag === tag);
              return entry?.category === cat;
            });
          });

          return (
            <div
              key={category.title}
              id="category-body-theme-container"
              className={`border border-border/40 rounded-2xl overflow-hidden transition-all duration-300
                ${isOpen ? "bg-card/30 border-border/80" : "bg-card/15 hover:bg-card/25 hover:border-border/60"}`}
            >
              <button
                onClick={() => toggleCategory(category.title)}
                className="w-full flex items-center justify-between py-4 px-5 text-left font-bold text-foreground focus:outline-none select-none cursor-pointer"
              >
                <span className={isEmbed ? "text-xs text-accent" : "text-sm text-accent font-bold"}>
                  {category.title}
                </span>
                <svg className={`w-4 h-4 text-muted/60 transition-transform duration-300 ${isOpen ? "rotate-180 text-accent" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (() => {
                if (!isBodyThemeExpanded) {
                  // 折り畳み時：最大24件
                  const sortedTags = [...displayTags].sort((a, b) => {
                    const idxA = catData.findIndex(tc => tc.tag === a);
                    const idxB = catData.findIndex(tc => tc.tag === b);
                    const orderA = idxA !== -1 ? idxA : 999999;
                    const orderB = idxB !== -1 ? idxB : 999999;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.localeCompare(b, "ja");
                  });
                  const displayedTags = sortedTags.filter((tag, idx) => idx < 24 || selectedTags.includes(tag));

                  return (
                    <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-wrap gap-2">
                        {displayedTags.map((tag) => {
                          const isActive = selectedTags.includes(tag);
                          return (
                            <button key={tag} onClick={() => onTagClick(tag)}
                              className={`rounded-lg transition-all duration-200 border text-xs font-medium cursor-pointer px-3 py-1.5 text-center
                                ${isActive
                                  ? "bg-accent/20 border-accent text-accent font-semibold shadow-[0_0_8px_rgba(214,180,106,0.2)] animate-pulse border-dashed"
                                  : "bg-background border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
                                }`}
                            >{tag}</button>
                          );
                        })}
                        {displayTags.length > 24 && (
                          <button type="button"
                            onClick={(e) => { e.preventDefault(); setIsBodyThemeExpanded(true); }}
                            className="rounded-lg border border-accent/40 bg-accent/5 text-accent text-xs font-semibold px-3 py-1.5 hover:bg-accent/10 transition-all cursor-pointer"
                          >
                            すべて表示（全{displayTags.length}件）
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // 展開時：カテゴリタブ + 検索欄 + 全タグ
                let filteredByCat = displayTags;
                if (selectedCategory !== "すべて") {
                  filteredByCat = displayTags.filter(tag => {
                    const item = catData.find(tc => tc.tag === tag);
                    const cat = item ? item.category : "その他";
                    return cat === selectedCategory;
                  });
                }

                let finalFiltered = filteredByCat;
                if (tagSearchQuery.trim()) {
                  const q = tagSearchQuery.trim();
                  finalFiltered = filteredByCat.filter(tag => matchTagNameWithSynonyms(tag, q));
                }

                const sortedTags = [...finalFiltered].sort((a, b) => {
                  if (selectedCategory === "すべて") {
                    const idxA = catData.findIndex(tc => tc.tag === a);
                    const idxB = catData.findIndex(tc => tc.tag === b);
                    const orderA = idxA !== -1 ? idxA : 999999;
                    const orderB = idxB !== -1 ? idxB : 999999;
                    if (orderA !== orderB) return orderA - orderB;
                  } else {
                    const itemA = catData.find(tc => tc.tag === a);
                    const itemB = catData.find(tc => tc.tag === b);
                    const orderA = itemA ? itemA.displayOrder : 999999;
                    const orderB = itemB ? itemB.displayOrder : 999999;
                    if (orderA !== orderB) return orderA - orderB;
                  }
                  return a.localeCompare(b, "ja");
                });

                return (
                  <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col gap-4 w-full">
                      {/* Tabs */}
                      <div className="relative w-full">
                        {/* Left Gradient Overlay */}
                        {showLeftGrad && (
                          <div 
                            className="absolute left-0 top-0 bottom-2.5 w-10 bg-gradient-to-r from-[#111111]/90 to-transparent pointer-events-none z-10 animate-in fade-in duration-200"
                          />
                        )}
                        {/* Right Gradient Overlay */}
                        {showRightGrad && (
                          <div 
                            className="absolute right-0 top-0 bottom-2.5 w-10 bg-gradient-to-l from-[#111111]/90 to-transparent pointer-events-none z-10 animate-in fade-in duration-200"
                          />
                        )}
                        <div 
                          ref={tabsRef}
                          onScroll={handleScroll}
                          onMouseDown={handleMouseDown}
                          onMouseLeave={handleMouseLeave}
                          onMouseUp={handleMouseUp}
                          onMouseMove={handleMouseMove}
                          className="flex gap-2 overflow-x-auto pb-2 category-scroll whitespace-nowrap border-b border-border/30"
                        >
                          {availableCategoryTabs.map(cat => {
                            const isCatActive = selectedCategory === cat;
                            return (
                              <button key={cat} type="button" onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                                  ${isCatActive
                                    ? "bg-accent/20 border-accent text-accent shadow-[0_0_8px_rgba(214,180,106,0.2)]"
                                    : "bg-background/40 border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
                                  }`}
                              >{cat}</button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Search bar */}
                      <div className="w-full">
                        <input type="text" value={tagSearchQuery}
                          onChange={(e) => setTagSearchQuery(e.target.value)}
                          placeholder="タグを検索"
                          className="w-full px-4 py-2.5 text-xs bg-background border border-border/60 rounded-xl text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/80 transition-colors"
                        />
                      </div>
                      {/* Tags list */}
                      <div className="max-h-[320px] overflow-y-auto pr-1 flex flex-wrap gap-2">
                        {sortedTags.length > 0 ? sortedTags.slice(0, maxDisplayCount).map((tag) => {
                          const isActive = selectedTags.includes(tag);
                          return (
                            <button key={tag} onClick={() => onTagClick(tag)}
                              className={`rounded-lg transition-all duration-200 border text-xs font-medium cursor-pointer px-3 py-1.5 text-center
                                ${isActive
                                  ? "bg-accent/20 border-accent text-accent font-semibold shadow-[0_0_8px_rgba(214,180,106,0.2)]"
                                  : "bg-background border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
                                }`}
                            >{tag}</button>
                          );
                        }) : (
                          <div className="text-muted/60 text-xs py-4 w-full text-center">該当するタグがありません</div>
                        )}
                      </div>

                      {sortedTags.length > maxDisplayCount && (
                        <div className="flex justify-start">
                          <button type="button"
                            onClick={(e) => { e.preventDefault(); setMaxDisplayCount(prev => prev + 100); }}
                            className="text-xs text-accent hover:text-accent/80 font-bold py-1.5 px-4 border border-accent/30 rounded-lg bg-accent/5 hover:bg-accent/10 transition-all cursor-pointer"
                          >
                            さらに表示（残り {sortedTags.length - maxDisplayCount} 件）
                          </button>
                        </div>
                      )}
                      {/* Collapse button */}
                      <div className="flex justify-start">
                        <button type="button"
                          onClick={(e) => { e.preventDefault(); setIsBodyThemeExpanded(false); }}
                          className="rounded-lg border border-accent/40 bg-accent/5 text-accent text-xs font-semibold px-3 py-1.5 hover:bg-accent/10 transition-all cursor-pointer"
                        >
                          表示を減らす
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        }

        // ── それ以外（シリーズ・レベル・講師・目的）：通常アコーディオン
        return (
          <div key={category.title}
            className={`border border-border/40 rounded-2xl overflow-hidden transition-all duration-300
              ${isOpen ? "bg-card/30 border-border/80" : "bg-card/15 hover:bg-card/25 hover:border-border/60"}`}
          >
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full flex items-center justify-between py-4 px-5 text-left font-bold text-foreground focus:outline-none select-none cursor-pointer"
            >
              <span className={isEmbed ? "text-xs text-accent" : "text-sm text-accent font-bold"}>
                {category.title}
              </span>
              <svg className={`w-4 h-4 text-muted/60 transition-transform duration-300 ${isOpen ? "rotate-180 text-accent" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    const isPurposeTag = category.title === "目的から探す";
                    return (
                      <button key={tag} onClick={() => onTagClick(tag)}
                        className={`rounded-lg transition-all duration-200 border text-xs font-medium cursor-pointer
                          ${isPurposeTag ? "w-full sm:w-auto text-left py-2.5 sm:py-1.5 px-4 sm:px-3" : "px-3 py-1.5 text-center"}
                          ${isActive
                            ? "bg-accent/20 border-accent text-accent font-semibold shadow-[0_0_8px_rgba(214,180,106,0.2)]"
                            : "bg-background border-border/50 text-muted hover:border-accent/40 hover:text-foreground"
                          }`}
                      >{tag}</button>
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

const SearchTags = React.memo(SearchTagsComponent);
export default SearchTags;


import React, { useState, useEffect } from "react";
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

// NEXTカテゴリタブの順序
const NEXT_TAG_CATEGORY_ORDER = [
  "すべて",
  "部位",
  "筋・組織",
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
  "筋・組織",
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

const SearchTags: React.FC<SearchTagsProps> = ({ 
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

  const visibleCategories = categories.filter(cat => cat.tags.length > 0);

  return (
    <div className={`space-y-3 ${isEmbed ? "mb-6" : "mb-10"}`}>
      {visibleCategories.map((category) => {
        const isOpen = !!openCategories[category.title];

        // ── NEXTの分野から探す：常時展開シンプルボタン
        if (category.title === "NEXTの分野から探す") {
          return (
            <div key={category.title} className="border border-border/40 rounded-2xl overflow-hidden bg-card/15">
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

          const availableCategoryTabs = categoryOrderList.filter(cat => {
            if (cat === "すべて") return true;
            return category.tags.some(tag => {
              const entry = catData.find(tc => tc.tag === tag);
              return entry?.category === cat;
            });
          });

          return (
            <div
              key={category.title}
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
                  const sortedTags = [...category.tags].sort((a, b) => {
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
                        {category.tags.length > 24 && (
                          <button type="button"
                            onClick={(e) => { e.preventDefault(); setIsBodyThemeExpanded(true); }}
                            className="rounded-lg border border-accent/40 bg-accent/5 text-accent text-xs font-semibold px-3 py-1.5 hover:bg-accent/10 transition-all cursor-pointer"
                          >
                            すべて表示（全{category.tags.length}件）
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // 展開時：カテゴリタブ + 検索欄 + 全タグ
                let filteredByCat = category.tags;
                if (selectedCategory !== "すべて") {
                  filteredByCat = category.tags.filter(tag => {
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
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap border-b border-border/30">
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
                        {sortedTags.length > 0 ? sortedTags.map((tag) => {
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

export default SearchTags;


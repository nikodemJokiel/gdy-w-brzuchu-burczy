import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import PostCard from "./PostCard";
import FilterPanel from "./FilterPanel";
import type { FilterState } from "./FilterPanel";
import { getAllTagsForCategory } from "../lib/taxonomy";
import "./PostGridClient.scss";

export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImage: any;
  gallery?: any[];
  tags: { name: string; slug: { current: string }; category: string }[];
}

interface PostGridClientProps {
  initialPosts: Post[];
}

const DEFAULT_VISIBLE_COUNT = 12;
const STORAGE_KEY_VISIBLE = "postGrid_visibleCount";
const STORAGE_KEY_EXTRA_VISIBLE = "postGrid_extraVisibleCount";
const STORAGE_KEY_SCROLL = "postGrid_scrollY";

function normalizeText(value: string | undefined | null) {
  return (value ?? "")
    .toLocaleLowerCase("pl-PL")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function splitParamValues(values: string[]) {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function getFiltersFromUrl(): { filters: FilterState; searchQuery: string } {
  if (typeof window === "undefined") {
    return { filters: { mealTypes: [], diets: [] }, searchQuery: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const selectedCategories = splitParamValues(params.getAll("category"));
  const selectedTags = splitParamValues(params.getAll("tag"));
  const matchMode = params.get("mode") === "AND" ? "AND" : "OR";

  return {
    filters: { selectedCategories, selectedTags, matchMode },
    searchQuery: params.get("q")?.trim() ?? "",
  };
}

function stemWord(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("owa") || word.endsWith("owe") || word.endsWith("owy") || word.endsWith("owi")) return word.slice(0, -3);
  if (word.endsWith("ych") || word.endsWith("ich") || word.endsWith("ego")) return word.slice(0, -3);
  if (word.endsWith("ach") || word.endsWith("ami")) return word.slice(0, -3);
  if (word.endsWith("ow") || word.endsWith("om")) return word.slice(0, -2);
  if (word.endsWith("a") || word.endsWith("e") || word.endsWith("i") || word.endsWith("y") || word.endsWith("u") || word.endsWith("o")) return word.slice(0, -1);
  return word;
}

function getSearchScore(post: Post, normalizedQuery: string) {
  if (!normalizedQuery) return 1;

  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean).map(stemWord);
  const tags = post.tags?.map((tag) => normalizeText(tag.name)) ?? [];
  const title = normalizeText(post.title);
  const excerpt = normalizeText(post.excerpt);
  const haystackWords = [title, excerpt, ...tags].join(" ").split(/\s+/).filter(Boolean);
  const stemmedHaystack = haystackWords.map(stemWord).join(" ");
  
  if (!queryParts.every((part) => stemmedHaystack.includes(part))) return 0;
  if (tags.some((tag) => stemWord(tag) === stemWord(normalizedQuery))) return 5;
  if (tags.some((tag) => stemWord(tag).includes(stemWord(normalizedQuery)))) return 4;
  if (stemWord(title).includes(stemWord(normalizedQuery))) return 3;
  if (stemWord(excerpt).includes(stemWord(normalizedQuery))) return 2;
  return 1;
}

function updateUrl(filters: FilterState, searchQuery: string) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  filters.selectedCategories.forEach((c) => params.append("category", c));
  filters.selectedTags.forEach((t) => params.append("tag", t));
  if (filters.matchMode === "AND") params.set("mode", "AND");
  if (searchQuery.trim()) params.set("q", searchQuery.trim());

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  window.history.replaceState(null, "", nextUrl);
}

export default function PostGridClient({ initialPosts }: PostGridClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    selectedCategories: [],
    selectedTags: [],
    matchMode: "OR",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const [extraVisibleCount, setExtraVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);
  const isRestoringScroll = useRef(false);
  const scrollThrottleRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // ── Event Bus for Search without reload ────────────────────────────────
  useEffect(() => {
    const handleCustomSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newQuery = customEvent.detail.query;
      setSearchQuery(newQuery);
      
      setFilters((prev) => {
        if (prev.matchMode !== "AND") {
          const nextFilters = { ...prev, matchMode: "AND" as const };
          updateUrl(nextFilters, newQuery);
          return nextFilters;
        }
        // Jeśli już jest AND, tylko aktualizujemy URL dla pewności (choć HeaderLeft już dodał q)
        updateUrl(prev, newQuery);
        return prev;
      });

      setVisibleCount(DEFAULT_VISIBLE_COUNT);
      setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("customSearchSubmit", handleCustomSearch);
    return () => window.removeEventListener("customSearchSubmit", handleCustomSearch);
  }, []);

  // ── Restore state from sessionStorage on mount ─────────────────────────
  useEffect(() => {
    let isBackNavigation = false;
    if (typeof performance !== "undefined" && performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType("navigation");
      if (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "back_forward") {
        isBackNavigation = true;
      }
    }

    if (!isBackNavigation) {
      sessionStorage.removeItem(STORAGE_KEY_VISIBLE);
      sessionStorage.removeItem(STORAGE_KEY_EXTRA_VISIBLE);
      sessionStorage.removeItem(STORAGE_KEY_SCROLL);
    }

    const { filters: urlFilters, searchQuery: urlSearchQuery } = getFiltersFromUrl();
    setFilters(urlFilters);
    setSearchQuery(urlSearchQuery);

    // Check if we have a saved visible count
    const savedCount = sessionStorage.getItem(STORAGE_KEY_VISIBLE);
    const savedExtraCount = sessionStorage.getItem(STORAGE_KEY_EXTRA_VISIBLE);
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);

    if (savedCount) {
      const count = parseInt(savedCount, 10);
      if (!isNaN(count) && count > DEFAULT_VISIBLE_COUNT) {
        setVisibleCount(count);
      }
    }

    if (savedExtraCount) {
      const extraCount = parseInt(savedExtraCount, 10);
      if (!isNaN(extraCount) && extraCount > DEFAULT_VISIBLE_COUNT) {
        setExtraVisibleCount(extraCount);
      }
    }

    if (savedCount || savedExtraCount) {
      isRestoringScroll.current = true;
      // Restore scroll position after DOM renders with the correct count
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (savedScroll) {
            const scrollY = parseInt(savedScroll, 10);
            if (!isNaN(scrollY)) {
              window.scrollTo(0, scrollY);
            }
          }
          isRestoringScroll.current = false;
        });
      });
    } else {
      setVisibleCount(DEFAULT_VISIBLE_COUNT);
      setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
    }

    setIsMounted(true);
    const styleEl = document.getElementById('prevent-flash-style');
    if (styleEl) styleEl.remove();
  }, []);

  // ── Save scroll position throttled ─────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoringScroll.current) return;

      if (scrollThrottleRef.current !== null) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }

      scrollThrottleRef.current = requestAnimationFrame(() => {
        sessionStorage.setItem(STORAGE_KEY_SCROLL, String(window.scrollY));
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollThrottleRef.current !== null) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }
    };
  }, []);

  // ── Save visibleCount whenever it changes ──────────────────────────────
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_VISIBLE, String(visibleCount));
  }, [visibleCount]);

  // ── Save extraVisibleCount whenever it changes ─────────────────────────
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_EXTRA_VISIBLE, String(extraVisibleCount));
  }, [extraVisibleCount]);

  const normalizedSearchQuery = normalizeText(searchQuery);
  const isSearchActive = !!normalizedSearchQuery;
  const isFilterActive = filters.selectedCategories.length > 0 || filters.selectedTags.length > 0;
  const isSearchOrFilterActive = isSearchActive || isFilterActive;
  const activeFilterCount = filters.selectedCategories.length + filters.selectedTags.length;

  const visiblePosts = useMemo(() => {
    if (!isSearchActive && !isFilterActive) return initialPosts;

    const searchResults = isSearchActive
      ? initialPosts
          .map((post) => ({ post, score: getSearchScore(post, normalizedSearchQuery) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime();
          })
          .map(({ post }) => post)
      : [];

    const filterResults = isFilterActive
      ? initialPosts.filter((post) => {
          const postTagNames = post.tags?.map((t) => t.name.toLowerCase()) || [];
          const hasCategories = filters.selectedCategories.length > 0;
          const hasTags = filters.selectedTags.length > 0;

          if (filters.matchMode === "OR") {
            let hasCatMatch = false;
            if (hasCategories) {
              hasCatMatch = filters.selectedCategories.some((categoryId) => {
                const categoryTags = getAllTagsForCategory(categoryId);
                return categoryTags.some((tag) => postTagNames.includes(tag.toLowerCase()));
              });
            }
            let hasTagMatch = false;
            if (hasTags) {
              hasTagMatch = filters.selectedTags.some((tag) => postTagNames.includes(tag.toLowerCase()));
            }
            return hasCatMatch || hasTagMatch;
          } else {
            // AND mode
            if (hasCategories) {
              const matchesAllCats = filters.selectedCategories.every((categoryId) => {
                const categoryTags = getAllTagsForCategory(categoryId);
                return categoryTags.some((tag) => postTagNames.includes(tag.toLowerCase()));
              });
              if (!matchesAllCats) return false;
            }
            if (hasTags) {
              const matchesAllTags = filters.selectedTags.every((tag) => postTagNames.includes(tag.toLowerCase()));
              if (!matchesAllTags) return false;
            }
            return true;
          }
        })
      : [];

    if (isSearchActive && !isFilterActive) return searchResults;
    if (!isSearchActive && isFilterActive) return filterResults;

    // Obie metody aktywne
    if (filters.matchMode === "AND") {
      // Część wspólna (intersection) - post musi spełniać wyszukiwanie i filtry
      const filterSet = new Set(filterResults.map((p) => p._id));
      return searchResults.filter((p) => filterSet.has(p._id));
    } else {
      // Suma (union) - wyniki wyszukiwania na początku, a potem pozostałe z filtrów
      const searchSet = new Set(searchResults.map((p) => p._id));
      const restFilter = filterResults.filter((p) => !searchSet.has(p._id));
      return [...searchResults, ...restFilter];
    }
  }, [initialPosts, normalizedSearchQuery, filters, isSearchActive, isFilterActive]);

  const alsoLikePosts = useMemo(() => {
    const visibleIds = new Set(visiblePosts.map(p => p._id));
    return initialPosts.filter(p => !visibleIds.has(p._id));
  }, [initialPosts, visiblePosts]);

  const isExhausted = visibleCount >= visiblePosts.length;

  const handleToggleFilter = useCallback((category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category] as string[];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
        
      const nextFilters = { ...prev, [category]: updated };
      updateUrl(nextFilters, searchQuery);
      return nextFilters;
    });
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [searchQuery]);

  const handleChangeMode = useCallback((mode: "OR" | "AND") => {
    setFilters((prev) => {
      const nextFilters = { ...prev, matchMode: mode };
      updateUrl(nextFilters, searchQuery);
      return nextFilters;
    });
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [searchQuery]);

  const handleClearFilters = useCallback(() => {
    const nextFilters = { selectedCategories: [], selectedTags: [], matchMode: "OR" as const };
    setFilters(nextFilters);
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
    updateUrl(nextFilters, searchQuery);
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
    updateUrl(filters, "");
  }, [filters]);

  const handleClearAll = useCallback(() => {
    const nextFilters = { selectedCategories: [], selectedTags: [], matchMode: "OR" as const };
    setFilters(nextFilters);
    setSearchQuery("");
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    setExtraVisibleCount(DEFAULT_VISIBLE_COUNT);
    updateUrl(nextFilters, "");
  }, []);

  const preventFlashScript = `
    if (window.location.search && (window.location.search.includes('q=') || window.location.search.includes('category=') || window.location.search.includes('tag='))) {
      var style = document.createElement('style');
      style.id = 'prevent-flash-style';
      style.innerHTML = '.post-grid { opacity: 0 !important; }';
      document.head.appendChild(style);
    }
  `;

  return (
    <div className={`post-grid-layout ${isMounted ? 'post-grid-layout--mounted' : ''}`}>
      <script dangerouslySetInnerHTML={{ __html: preventFlashScript }} />
      <div className="post-grid-layout__top">
        <div className="post-grid-layout__top-left">
          {searchQuery && (
            <div className="post-grid-layout__search-summary">
              Wyniki dla: <strong>{searchQuery}</strong>
              <button type="button" onClick={handleClearSearch} style={{ marginLeft: "0.5rem" }}>Wyczyść</button>
            </div>
          )}
          
          <label className={`post-grid-layout__switch ${isFilterOpen ? "is-visible" : ""}`}>
            <input 
              type="checkbox" 
              checked={filters.matchMode === "AND"} 
              onChange={(e) => handleChangeMode(e.target.checked ? "AND" : "OR")} 
            />
            <span className="post-grid-layout__switch-slider"></span>
            <span className="post-grid-layout__switch-text">Wymagaj wszystkich</span>
          </label>
        </div>
        
        <div className="post-grid-layout__top-right">
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="post-grid-layout__clear-filters"
              onClick={handleClearFilters}
            >
              Wyczyść filtry
            </button>
          )}
          
          <button
            type="button"
            className={`post-grid-layout__filter-toggle ${isFilterOpen ? "is-active" : ""}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filtruj
            {activeFilterCount > 0 && (
              <span className="post-grid-layout__filter-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className={`post-grid-layout__filter-container ${isFilterOpen ? "is-open" : ""}`}>
        <FilterPanel
          filters={filters}
          onToggleFilter={handleToggleFilter}
          onChangeMode={handleChangeMode}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </div>

      {isSearchOrFilterActive && visiblePosts.length === 0 && (
        <div className="post-grid-layout__notice">
          <p>Niestety nie znaleźliśmy tego, czego szukasz. Spróbuj zmienić parametry w sekcji filtruj lub wyłącz opcję "Wymagaj wszystkich".</p>
          <button type="button" className="post-grid-layout__clear-btn" onClick={handleClearAll}>
            Wyczyść filtry i wyszukiwanie
          </button>
        </div>
      )}

      <div className="post-grid">
        {visiblePosts.slice(0, visibleCount).map((post) => (
          <PostCard
            key={post._id}
            slug={post.slug.current}
            title={post.title}
            date={post.publishedAt}
            excerpt={post.excerpt}
            mainImage={post.mainImage}
            gallery={post.gallery}
          />
        ))}
      </div>

      {!isExhausted && (
        <div className="post-grid-layout__actions">
          <button
            type="button"
            className="post-grid-layout__load-more"
            onClick={() => setVisibleCount((previous) => previous + DEFAULT_VISIBLE_COUNT)}
          >
            Zobacz więcej
          </button>
        </div>
      )}

      {isSearchOrFilterActive && isExhausted && alsoLikePosts.length > 0 && (
        <div className="post-grid-layout__also-like">
          <h2>Zobacz także...</h2>
          <div className="post-grid">
            {alsoLikePosts.slice(0, extraVisibleCount).map((post) => (
              <PostCard
                key={post._id}
                slug={post.slug.current}
                title={post.title}
                date={post.publishedAt}
                excerpt={post.excerpt}
                mainImage={post.mainImage}
                gallery={post.gallery}
              />
            ))}
          </div>
          {extraVisibleCount < alsoLikePosts.length && (
            <div className="post-grid-layout__actions">
              <button
                type="button"
                className="post-grid-layout__load-more"
                onClick={() => setExtraVisibleCount((previous) => previous + DEFAULT_VISIBLE_COUNT)}
              >
                Zobacz więcej
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

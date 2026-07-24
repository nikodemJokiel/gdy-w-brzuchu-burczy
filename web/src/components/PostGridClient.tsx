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

function getSearchScore(post: Post, normalizedQuery: string) {
  if (!normalizedQuery) return 1;

  const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);
  const tags = post.tags?.map((tag) => normalizeText(tag.name)) ?? [];
  const title = normalizeText(post.title);
  const excerpt = normalizeText(post.excerpt);
  const haystack = [title, excerpt, ...tags].join(" ");

  if (!queryParts.every((part) => haystack.includes(part))) return 0;
  if (tags.some((tag) => tag === normalizedQuery)) return 5;
  if (tags.some((tag) => tag.includes(normalizedQuery))) return 4;
  if (title.includes(normalizedQuery)) return 3;
  if (excerpt.includes(normalizedQuery)) return 2;
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
  const isRestoringScroll = useRef(false);
  const scrollThrottleRef = useRef<number | null>(null);

  // ── Restore state from sessionStorage on mount ─────────────────────────
  useEffect(() => {
    const { filters: urlFilters, searchQuery: urlSearchQuery } = getFiltersFromUrl();
    setFilters(urlFilters);
    setSearchQuery(urlSearchQuery);

    // Check if we have a saved visible count (user pressed back)
    const savedCount = sessionStorage.getItem(STORAGE_KEY_VISIBLE);
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);

    if (savedCount) {
      const count = parseInt(savedCount, 10);
      if (!isNaN(count) && count > DEFAULT_VISIBLE_COUNT) {
        setVisibleCount(count);
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
      }
    } else {
      setVisibleCount(DEFAULT_VISIBLE_COUNT);
    }
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

  const postsMatchingFilters = useMemo(() => {
    return initialPosts.filter((post) => {
      const postTagNames = post.tags?.map(t => t.name.toLowerCase()) || [];
      const hasCategories = filters.selectedCategories.length > 0;
      const hasTags = filters.selectedTags.length > 0;

      if (!hasCategories && !hasTags) return true;

      if (filters.matchMode === "OR") {
        if (hasCategories) {
          const hasMatchingCat = filters.selectedCategories.some(categoryId => {
            const categoryTags = getAllTagsForCategory(categoryId);
            return categoryTags.some(tag => postTagNames.includes(tag.toLowerCase()));
          });
          if (hasMatchingCat) return true;
        }
        if (hasTags) {
          const hasMatchingTag = filters.selectedTags.some(tag => postTagNames.includes(tag.toLowerCase()));
          if (hasMatchingTag) return true;
        }
        return false;
      } else {
        // AND mode
        if (hasCategories) {
          const matchesAllCats = filters.selectedCategories.every(categoryId => {
            const categoryTags = getAllTagsForCategory(categoryId);
            return categoryTags.some(tag => postTagNames.includes(tag.toLowerCase()));
          });
          if (!matchesAllCats) return false;
        }
        if (hasTags) {
          const matchesAllTags = filters.selectedTags.every(tag => postTagNames.includes(tag.toLowerCase()));
          if (!matchesAllTags) return false;
        }
        return true;
      }
    });
  }, [initialPosts, filters]);

  const normalizedSearchQuery = normalizeText(searchQuery);

  const postsMatchingSearch = useMemo(() => {
    if (!normalizedSearchQuery) return postsMatchingFilters;

    return postsMatchingFilters
      .map((post) => ({ post, score: getSearchScore(post, normalizedSearchQuery) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime();
      })
      .map(({ post }) => post);
  }, [postsMatchingFilters, normalizedSearchQuery]);

  const isSearchEmpty = normalizedSearchQuery.length > 0 && postsMatchingSearch.length === 0;
  const visiblePosts = isSearchEmpty ? postsMatchingFilters : postsMatchingSearch;
  const activeFilterCount = filters.selectedCategories.length + filters.selectedTags.length;

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
  }, [searchQuery]);

  const handleChangeMode = useCallback((mode: "OR" | "AND") => {
    setFilters((prev) => {
      const nextFilters = { ...prev, matchMode: mode };
      updateUrl(nextFilters, searchQuery);
      return nextFilters;
    });
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [searchQuery]);

  const handleClearFilters = useCallback(() => {
    const nextFilters = { selectedCategories: [], selectedTags: [], matchMode: "OR" as const };
    setFilters(nextFilters);
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    updateUrl(nextFilters, searchQuery);
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    updateUrl(filters, "");
  }, [filters]);

  const handleClearAll = useCallback(() => {
    const nextFilters = { selectedCategories: [], selectedTags: [], matchMode: "OR" as const };
    setFilters(nextFilters);
    setSearchQuery("");
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
    updateUrl(nextFilters, "");
  }, []);

  return (
    <div className="post-grid-layout">
      <div className="post-grid-layout__top">
        <div className="post-grid-layout__top-left">
          {searchQuery && (
            <div className="post-grid-layout__search-summary">
              Wyniki dla: <strong>{searchQuery}</strong>
              <button type="button" onClick={handleClearSearch}>Wyczyść</button>
            </div>
          )}
          
          {isFilterOpen && (
            <label className="post-grid-layout__switch">
              <input 
                type="checkbox" 
                checked={filters.matchMode === "AND"} 
                onChange={(e) => handleChangeMode(e.target.checked ? "AND" : "OR")} 
              />
              <span className="post-grid-layout__switch-slider"></span>
              <span className="post-grid-layout__switch-text">Wymagaj wszystkich</span>
            </label>
          )}
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

      {isSearchEmpty && postsMatchingFilters.length > 0 && (
        <div className="post-grid-layout__notice">
          <p>Nie znaleziono dokładnych wyników. Poniżej pokazuję pozostałe przepisy zgodne z filtrami.</p>
          <button type="button" onClick={handleClearSearch}>Wyczyść wyszukiwanie</button>
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

      {visiblePosts.length === 0 && (
        <div className="post-grid-layout__empty">
          <p>Brak przepisów spełniających wybrane kryteria.</p>
          <button type="button" onClick={handleClearAll}>
            Wyczyść filtry i wyszukiwanie
          </button>
        </div>
      )}

      {visibleCount < visiblePosts.length && (
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
    </div>
  );
}

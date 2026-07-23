import React, { useState, useMemo, useCallback, useEffect } from "react";
import PostCard from "./PostCard";
import FilterPanel from "./FilterPanel";
import type { FilterState } from "./FilterPanel";
import "./PostGridClient.scss";

export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  mainImage: any;
  gallery?: any[];
  mealType: string;
  diet: string[];
  tags: { name: string; slug: { current: string }; category: string }[];
}

interface PostGridClientProps {
  initialPosts: Post[];
}

export default function PostGridClient({ initialPosts }: PostGridClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    mealTypes: [],
    diets: [],
  });
  const [visibleCount, setVisibleCount] = useState(12);

  // Dodajemy debug hydration
  useEffect(() => {
    console.log("PostGridClient hydrated and mounted on the client!");
  }, []);

  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      if (filters.mealTypes.length > 0 && !filters.mealTypes.includes(post.mealType)) {
        return false;
      }
      if (filters.diets.length > 0) {
        const hasMatchingDiet = filters.diets.some((d) => post.diet?.includes(d));
        if (!hasMatchingDiet) return false;
      }
      return true;
    });
  }, [initialPosts, filters]);

  const activeFilterCount = filters.mealTypes.length + filters.diets.length;

  const handleToggleFilter = useCallback((category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setVisibleCount(12);
  }, []);

  return (
    <div className="post-grid-layout">
      {/* Top bar with filter toggle */}
      <div className="post-grid-layout__top">
        <button
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

      {/* Full-width Filter Panel under the toggle */}
      <div className={`post-grid-layout__filter-container ${isFilterOpen ? "is-open" : ""}`}>
        <FilterPanel
          filters={filters}
          onToggleFilter={handleToggleFilter}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />
      </div>

      {/* Main content area: 3-column grid */}
      <div className="post-grid">
        {filteredPosts.slice(0, visibleCount).map((post) => (
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

      {filteredPosts.length === 0 && (
        <div className="post-grid-layout__empty">
          <p>Brak przepisów spełniających wybrane kryteria.</p>
          <button onClick={() => setFilters({ mealTypes: [], diets: [] })}>
            Wyczyść filtry
          </button>
        </div>
      )}

      {visibleCount < filteredPosts.length && (
        <div className="post-grid-layout__actions">
          <button
            className="post-grid-layout__load-more"
            onClick={() => setVisibleCount((p) => p + 12)}
          >
            Zobacz więcej
          </button>
        </div>
      )}
    </div>
  );
}

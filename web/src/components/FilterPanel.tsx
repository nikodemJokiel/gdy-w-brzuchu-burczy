import React from "react";
import "./FilterPanel.scss";
import { TAXONOMY } from "../lib/taxonomy";

export interface FilterState {
  selectedCategories: string[];
  selectedTags: string[];
  matchMode: "OR" | "AND";
}

export interface FilterPanelProps {
  filters: FilterState;
  onToggleFilter: (category: keyof FilterState, value: string) => void;
  onChangeMode: (mode: "OR" | "AND") => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({ filters, onToggleFilter, onChangeMode, isOpen, onClose }: FilterPanelProps) {
  return (
    <div className="filter-panel">
      {TAXONOMY.map(section => {
        const renderCategory = (category: any) => {
          const isCategorySelected = filters.selectedCategories.includes(category.id);
          const hasSelectedTags = category.tags?.some((tag: string) => filters.selectedTags.includes(tag));
          const pillClass = `filter-panel__pill ${isCategorySelected ? "is-active" : (hasSelectedTags ? "is-partially-active" : "")}`;
          
          return (
            <div key={category.id} className={`filter-panel__category-card filter-panel__category-card--${category.id}`}>
              <button
                className={pillClass}
                onClick={() => onToggleFilter("selectedCategories", category.id)}
                aria-pressed={isCategorySelected}
              >
                {category.icon && <span className="filter-panel__pill-icon"><category.icon size={16} /></span>}
                {category.label}
              </button>
              
              {!category.hideSubTags && category.tags && category.tags.length > 0 && (
                <div className="filter-panel__sub-tags">
                  {category.tags.map(tag => {
                    const isTagSelected = filters.selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        className={`filter-panel__sub-pill ${isTagSelected ? "is-active" : ""}`}
                        onClick={() => onToggleFilter("selectedTags", tag)}
                        aria-pressed={isTagSelected}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        };

        return (
          <div key={section.id} className={`filter-panel__section filter-panel__section--${section.id}`}>
            <h2 className="filter-panel__label">{section.label}</h2>
            <div className="filter-panel__grid">
              {section.categories.map(renderCategory)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

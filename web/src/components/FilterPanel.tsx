import React from "react";
import "./FilterPanel.scss";

export interface FilterState {
  mealTypes: string[];
  diets: string[];
}

export interface FilterPanelProps {
  filters: FilterState;
  onToggleFilter: (category: keyof FilterState, value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MEAL_TYPES = [
  { value: "breakfast", label: "Śniadania" },
  { value: "lunch", label: "Obiady" },
  { value: "dinner", label: "Kolacje" },
  { value: "dessert", label: "Desery" },
  { value: "snack", label: "Przekąski" },
  { value: "drink", label: "Napoje" },
];

const DIETS = [
  { value: "vegetarian", label: "Wegetariańskie" },
  { value: "vegan", label: "Wegańskie" },
  { value: "gluten-free", label: "Bezglutenowe" },
  { value: "dairy-free", label: "Bez mleka" },
  { value: "sugar-free", label: "Bez cukru" },
];

export default function FilterPanel({ filters, onToggleFilter, isOpen, onClose }: FilterPanelProps) {
  if (!isOpen) return null;

  const renderPills = (category: keyof FilterState, options: { value: string; label: string }[]) => (
    <div className="filter-panel__group">
      {options.map((opt) => {
        const isSelected = filters[category].includes(opt.value);
        return (
          <button
            key={opt.value}
            className={`filter-panel__pill ${isSelected ? "is-active" : ""}`}
            onClick={() => onToggleFilter(category, opt.value)}
            aria-pressed={isSelected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="filter-panel">
      <div className="filter-panel__section">
        <h4 className="filter-panel__label">Rodzaj posiłku</h4>
        {renderPills("mealTypes", MEAL_TYPES)}
      </div>

      <div className="filter-panel__section">
        <h4 className="filter-panel__label">Diety</h4>
        {renderPills("diets", DIETS)}
      </div>
    </div>
  );
}

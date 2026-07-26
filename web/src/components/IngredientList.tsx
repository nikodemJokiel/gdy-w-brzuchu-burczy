import React, { useState } from "react";
import "./IngredientList.scss";

interface Ingredient {
  _key: string;
  name: string;
  amount?: string;
  unit?: string;
  group?: string;
}

interface IngredientListProps {
  ingredients: Ingredient[];
}

export default function IngredientList({ ingredients }: IngredientListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  const toggleIngredient = (key: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Group ingredients by their "group" field
  const groupedIngredients = ingredients.reduce((acc, ingredient) => {
    const groupName = ingredient.group || "Główne";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(ingredient);
    return acc;
  }, {} as Record<string, Ingredient[]>);

  const groups = Object.keys(groupedIngredients);

  return (
    <div className="ingredient-list">
      <h3 className="ingredient-list__title">Składniki</h3>
      <div className="ingredient-list__content">
        {groups.map((group) => (
          <div key={group} className="ingredient-list__group">
            {group !== "Główne" && (
              <h4 className="ingredient-list__group-title">{group}</h4>
            )}
            <ul className="ingredient-list__items">
              {groupedIngredients[group].map((ingredient, index) => {
                // generate a fallback key if _key is missing
                const key = ingredient._key || `${ingredient.name}-${ingredient.amount}-${index}`;
                const isChecked = checkedItems.has(key);

                return (
                  <li
                    key={key}
                    className={`ingredient-list__item ${
                      isChecked ? "is-checked" : ""
                    }`}
                    onClick={() => toggleIngredient(key)}
                  >
                    <div className={`ingredient-list__checkbox ${isChecked ? "is-checked" : ""}`}>
                      {isChecked && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="ingredient-list__text">
                      <span className="ingredient-list__name">
                        {ingredient.name}
                      </span>
                      {(ingredient.amount || ingredient.unit) && (
                        <span className="ingredient-list__measure">
                          {ingredient.amount} {ingredient.unit}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

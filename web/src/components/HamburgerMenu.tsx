import React, { useEffect, useRef } from "react";
import "./HamburgerMenu.scss";
import { TAXONOMY } from "../lib/taxonomy";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const allCategories = TAXONOMY.flatMap(s => s.categories);

  const renderCategory = (id: string, options?: { hidePill?: boolean, tagsStart?: number, tagsEnd?: number }) => {
    const category = allCategories.find(c => c.id === id);
    if (!category) return null;

    const tags = category.tags ? category.tags.slice(options?.tagsStart || 0, options?.tagsEnd) : [];
    const hasVisibleSubtags = !category.hideSubTags && tags.length > 0;

    return (
      <div key={`${id}-${options?.tagsStart || 0}`} className={`hamburger-menu__category-card hamburger-menu__category-card--${category.id} ${!hasVisibleSubtags ? 'hamburger-menu__category-card--no-subtags' : ''} ${options?.hidePill ? 'hamburger-menu__category-card--no-pill' : ''}`}>
        {!options?.hidePill && (
          <a href={`/przepisy?category=${category.id}`} className="hamburger-menu__pill" onClick={onClose}>
            {category.icon && <span className="hamburger-menu__pill-icon"><category.icon size={16} /></span>}
            {category.label}
          </a>
        )}
        
        {hasVisibleSubtags && (
          <div className="hamburger-menu__sub-tags">
            {tags.map((tag: string) => (
              <a 
                key={tag} 
                href={`/przepisy?tag=${encodeURIComponent(tag)}`} 
                className="hamburger-menu__sub-pill"
                onClick={onClose}
              >
                {tag}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`hamburger-menu ${isOpen ? "is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="hamburger-menu__overlay" onClick={onClose}></div>
      <nav className="hamburger-menu__content" aria-label="Menu kategorii" ref={menuRef}>
        
        <div className="hamburger-menu__top-bar">
          <a href="/przepisy" className="hamburger-menu__link-all" onClick={onClose}>
            Zobacz wszystkie przepisy &rarr;
          </a>
        </div>
        
        <div className="hamburger-menu__mega-grid">
          {/* Salty Section */}
          <div className="hamburger-menu__mega-section hamburger-menu__mega-section--salty">
            <h3 className="hamburger-menu__label">Na słono</h3>
            <div className="hamburger-menu__cols">
              <div className="hamburger-menu__col">
                {renderCategory("light")}
                {renderCategory("meatless")}
                {renderCategory("fish")}
              </div>
              <div className="hamburger-menu__col">
                {renderCategory("meat")}
                {renderCategory("soup")}
              </div>
              <div className="hamburger-menu__col">
                {renderCategory("grains")}
                {renderCategory("baking")}
              </div>
            </div>
          </div>

          {/* Sweet Section */}
          <div className="hamburger-menu__mega-section hamburger-menu__mega-section--sweet">
            <h3 className="hamburger-menu__label">Na słodko</h3>
            <div className="hamburger-menu__cols">
              <div className="hamburger-menu__col">
                {renderCategory("cakes", { tagsEnd: 8 })}
              </div>
              <div className="hamburger-menu__col">
                {renderCategory("cakes", { hidePill: true, tagsStart: 8 })}
                {renderCategory("desserts")}
              </div>
              <div className="hamburger-menu__col">
                {renderCategory("cookies")}
                {renderCategory("drinks")}
              </div>
            </div>
          </div>

          {/* Occasions Section */}
          <div className="hamburger-menu__mega-section hamburger-menu__mega-section--occasions">
            <h3 className="hamburger-menu__label">Okazje</h3>
            <div className="hamburger-menu__cols hamburger-menu__cols--occasions">
              {renderCategory("christmas")}
              {renderCategory("easter")}
              {renderCategory("sylwester")}
              {renderCategory("halloween")}
              {renderCategory("fat-thursday")}
              {renderCategory("valentines")}
              {renderCategory("grill")}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

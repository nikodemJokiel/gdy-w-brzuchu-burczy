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
        <div className="hamburger-menu__socials">
          <a
            href="https://www.facebook.com/gdywbrzuchuburczy.blog/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
          </a>
          <a
            href="https://www.instagram.com/gdywbrzuchuburczy/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
          </a>
        </div>

        <div className="hamburger-menu__top-bar">
          <div className="hamburger-menu__extra-links">
            <a href="/wspolpraca" className="hamburger-menu__link-extra" onClick={onClose}>
              Współpraca
            </a>
            <a href="/o-mnie" className="hamburger-menu__link-extra" onClick={onClose}>
              O mnie
            </a>
          </div>
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

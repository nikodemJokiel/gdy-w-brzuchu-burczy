import React, { useEffect, useRef } from "react";
import "./HamburgerMenu.scss";

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

  return (
    <div
      className={`hamburger-menu ${isOpen ? "is-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="hamburger-menu__overlay" onClick={onClose}></div>
      <nav className="hamburger-menu__content" aria-label="Menu kategorii" ref={menuRef}>
        <a href="/przepisy" className="hamburger-menu__link hamburger-menu__link--primary">
          Zobacz wszystkie przepisy
        </a>
        <div className="hamburger-menu__divider"></div>
        <h3 className="hamburger-menu__heading">Kategorie</h3>
        <a href="/przepisy?mealType=breakfast" className="hamburger-menu__link">Śniadania</a>
        <a href="/przepisy?mealType=lunch" className="hamburger-menu__link">Obiady</a>
        <a href="/przepisy?mealType=dinner" className="hamburger-menu__link">Kolacje</a>
        <a href="/przepisy?mealType=dessert" className="hamburger-menu__link">Desery</a>
        <a href="/przepisy?mealType=snack" className="hamburger-menu__link">Przekąski</a>
        <a href="/przepisy?mealType=drink" className="hamburger-menu__link">Napoje</a>
        <div className="hamburger-menu__divider"></div>
        <h3 className="hamburger-menu__heading">Kuchnie świata</h3>
        <a href="/przepisy?diet=vegetarian" className="hamburger-menu__link">Wegetariańskie</a>
        <a href="/przepisy?diet=vegan" className="hamburger-menu__link">Wegańskie</a>
        <a href="/przepisy?diet=gluten-free" className="hamburger-menu__link">Bezglutenowe</a>
      </nav>
    </div>
  );
}

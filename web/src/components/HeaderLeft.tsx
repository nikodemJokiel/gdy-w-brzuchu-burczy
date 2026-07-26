import React, { useState, useEffect } from "react";
import HamburgerMenu from "./HamburgerMenu";
import "./HeaderLeft.scss";

const PLACEHOLDERS = [
  "Szukaj przepisów..."
];

export default function HeaderLeft() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("q") || "";
    }
    return "";
  });
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasFinishedTyping, setHasFinishedTyping] = useState(false);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.classList.add("mobile-search-open");
      if (window.innerWidth <= 768) {
        setPlaceholderText("");
        setPlaceholderIndex(0);
        setIsDeleting(false);
        setHasFinishedTyping(false);
      }
    } else {
      document.body.classList.remove("mobile-search-open");
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (hasFinishedTyping) return;

    let typingSpeed = isDeleting ? 30 : 70;
    const currentFullText = PLACEHOLDERS[placeholderIndex];

    if (!isDeleting && placeholderText === currentFullText) {
      if (placeholderIndex === PLACEHOLDERS.length - 1) {
        setHasFinishedTyping(true);
        return;
      }
      typingSpeed = 1500;
      setIsDeleting(true);
    } else if (isDeleting && placeholderText === "") {
      setIsDeleting(false);
      setPlaceholderIndex((prev) => prev + 1);
      typingSpeed = 400;
    }

    const timeout = setTimeout(() => {
      setPlaceholderText((prev) => {
        if (isDeleting) return prev.slice(0, -1);
        return currentFullText.slice(0, prev.length + 1);
      });
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, placeholderIndex, hasFinishedTyping]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      const isSearchPage = window.location.pathname.replace(/\/$/, "") === "/przepisy";
      
      if (isSearchPage) {
        const url = new URL(window.location.href);
        url.searchParams.set("q", trimmed);
        window.history.pushState({}, "", url);
        
        const event = new CustomEvent("customSearchSubmit", {
          detail: { query: trimmed }
        });
        window.dispatchEvent(event);
      } else {
        window.location.href = `/przepisy?q=${encodeURIComponent(trimmed)}&mode=AND`;
      }
      
      if (window.innerWidth <= 768) {
        setIsSearchOpen(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const toggleMenu = () => {
    if (!isMenuOpen) setIsSearchOpen(false);
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSearch = () => {
    if (!isSearchOpen) setIsMenuOpen(false);
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <>
      <div className="header__left">
        <button
          className="header__hamburger"
          aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={isMenuOpen}
          onClick={toggleMenu}
        >
          <span className="header__hamburger-line"></span>
          <span className="header__hamburger-line"></span>
        </button>

        <div className={`header__search ${isSearchOpen ? "is-active" : ""}`}>
          <button
            type="button"
            className="header__search-icon-btn"
            aria-label="Szukaj przepisów"
            onClick={toggleSearch}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </button>
          
          <form className="header__search-form" onSubmit={handleSearch}>
            <div className="header__search-input-wrapper">
              <svg className="header__search-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input
                type="search"
                maxLength={40}
                placeholder={placeholderText || " "}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header__search-input"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="header__search-clear-btn" 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearSearch}
                  aria-label="Wyczyść wyszukiwanie"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" className="header__search-submit-btn">Szukaj</button>
          </form>
        </div>
      </div>
      
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

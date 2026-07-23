import React, { useState } from "react";
import HamburgerMenu from "./HamburgerMenu";
import "./HeaderLeft.scss";

export default function HeaderLeft() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/przepisy?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <div className="header__left">
        <button
          className="header__hamburger"
          aria-label="Otwórz menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
        >
          <span className="header__hamburger-line"></span>
          <span className="header__hamburger-line"></span>
        </button>

        <div className={`header__search ${isSearchOpen ? "is-active" : ""}`}>
          <button
            className="header__search-btn"
            aria-label="Szukaj przepisów"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </button>
          
          <form className="header__search-form" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Szukaj przepisów..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header__search-input"
            />
          </form>
        </div>
      </div>
      
      <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

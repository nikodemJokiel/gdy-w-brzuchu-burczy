import React, { useState, useEffect } from "react";
import HamburgerMenu from "./HamburgerMenu";
import "./HeaderLeft.scss";

const PLACEHOLDERS = ["Szukaj przepisów..."];

export default function HeaderLeft() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setIsMenuOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
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

  const [isTypingReady, setIsTypingReady] = useState(true);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.classList.add("mobile-search-open");
      if (window.innerWidth <= 1024) {
        setPlaceholderText("");
        setPlaceholderIndex(0);
        setIsDeleting(false);
        setHasFinishedTyping(false);
        setIsTypingReady(false);

        const t = setTimeout(() => {
          setIsTypingReady(true);
        }, 600);
        return () => clearTimeout(t);
      } else {
        setIsTypingReady(true);
      }
    } else {
      document.body.classList.remove("mobile-search-open");
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (hasFinishedTyping || !isTypingReady) return;

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
  }, [placeholderText, isDeleting, placeholderIndex, hasFinishedTyping, isTypingReady]);

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
          detail: { query: trimmed },
        });
        window.dispatchEvent(event);
      } else {
        window.location.href = `/przepisy?q=${encodeURIComponent(trimmed)}&mode=AND`;
      }

      if (window.innerWidth <= 1024) {
        setIsSearchOpen(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    window.history.pushState({ menu: "open" }, "");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    if (window.history.state?.menu === "open") {
      window.history.back();
    }
  };

  const toggleMenu = () => {
    if (!isMenuOpen) setIsSearchOpen(false);
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const toggleSearch = () => {
    if (!isSearchOpen) {
      if (isMenuOpen) {
        closeMenu();
        setTimeout(() => {
          setIsSearchOpen(true);
        }, 400);
      } else {
        setIsSearchOpen(true);
      }
    } else {
      setIsSearchOpen(false);
    }
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
            className="header__search-toggle-btn"
            aria-label={isSearchOpen ? "Zamknij wyszukiwanie" : "Otwórz wyszukiwanie"}
            onClick={toggleSearch}
          >
            <svg
              className="icon-search"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <svg
              className="icon-close"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <form className="header__search-form" onSubmit={handleSearch}>
            <div className="header__search-input-wrapper">
              <input
                type="search"
                maxLength={40}
                placeholder={placeholderText || " "}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header__search-input"
                aria-label="Szukaj przepisów"
              />
              <div className="header__search-actions">
                {searchQuery && (
                  <button
                    type="button"
                    className="header__search-clear-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearSearch}
                    aria-label="Wyczyść wyszukiwanie"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="header__search-submit-icon" aria-label="Szukaj">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <HamburgerMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  );
}

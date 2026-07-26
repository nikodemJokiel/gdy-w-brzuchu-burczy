import React, { useState, useEffect } from "react";
import "./ScrollToTop.scss";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Pokaż po przescrollowaniu w dół
      // Dla mobile 2 rząd postów, dla web 6 postów
      // Orientacyjnie 800px to dobra wartość progowa dla obu
      if (window.scrollY > 800) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const filterElement = document.querySelector(".post-grid-layout__top");
    if (filterElement) {
      const y = filterElement.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      className={`scroll-to-top ${isVisible ? "is-visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Wróć na górę"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </button>
  );
}

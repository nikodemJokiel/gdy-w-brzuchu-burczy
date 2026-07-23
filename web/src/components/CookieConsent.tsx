import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already consented
    const hasConsented = localStorage.getItem("cookie-consent");
    if (!hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        right: "1rem",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)" }}>
        Ta strona używa plików cookies w celu zapewnienia najlepszej jakości usług.
        Kontynuując przeglądanie, wyrażasz na to zgodę.
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <a 
          href="/polityka-prywatnosci" 
          style={{ 
            fontSize: "0.875rem", 
            padding: "0.5rem 1rem",
            color: "var(--color-muted)",
            textDecoration: "none"
          }}
        >
          Dowiedz się więcej
        </a>
        <button
          onClick={handleAccept}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Akceptuję
        </button>
      </div>
    </div>
  );
}

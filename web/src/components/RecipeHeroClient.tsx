import React, { useRef, useState, useEffect } from "react";
import { urlFor } from "../lib/sanity";
import "./RecipeHeroClient.scss";

interface Tag {
  name: string;
  slug: { current: string };
  category?: string;
}

interface Props {
  title: string;
  publishedAt: string;
  prepTime?: number;
  cookTime?: number;
  tags?: Tag[];
  mainImage: any;
  gallery?: any[];
}

export default function RecipeHeroClient({
  title,
  publishedAt,
  prepTime,
  cookTime,
  tags,
  mainImage,
  gallery,
}: Props) {
  const dateObj = new Date(publishedAt);
  const formattedDate = publishedAt
    ? `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`
    : "Brak daty";

  const baseImages = [mainImage, ...(gallery || [])].filter(Boolean);
  const [isMobileState, setIsMobileState] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setIsMobileState(window.innerWidth < 1024);
    const handleResize = () => {
      setIsMobileState(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayImages = isMobileState ? baseImages : [
    ...baseImages,
    ...baseImages,
    ...baseImages,
    ...baseImages,
    ...baseImages,
    ...baseImages,
    ...baseImages,
  ];

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const wasDraggingRef = useRef(false);

  // Zmienne do pędu (momentum)
  const rafRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);

  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || baseImages.length === 0) return;

    const centerCarousel = () => {
      if (window.innerWidth < 1024) {
        setIsReady(true);
        return;
      }

      const centerImg = document.getElementById('hero-carousel-center-img');
      if (!centerImg || !trackRef.current) return;
      
      const trackCenter = trackRef.current.clientWidth / 2;
      const imgCenter = centerImg.offsetLeft + centerImg.clientWidth / 2;
      const targetScrollLeft = imgCenter - trackCenter;

      trackRef.current.style.scrollBehavior = 'auto';
      trackRef.current.scrollLeft = targetScrollLeft; 
      
      // Pokazujemy karuzelę dopiero po wycentrowaniu
      setIsReady(true);
    };

    const imgs = Array.from(track.querySelectorAll('img'));
    
    // Czekamy na załadowanie się wszystkich zdjęć, by mieć pewność co do ich wymiarów
    Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve); // na wypadek błędu też puszczamy dalej
      });
    })).then(() => {
      if (!hasAnimatedRef.current) {
        hasAnimatedRef.current = true;
        centerCarousel();
      }
    });

  }, [baseImages.length]);

  const startDrag = (x: number) => {
    if (window.innerWidth < 1024) return; // Wyłącz dragowanie JS na mobilkach/tabletach
    setIsDragging(true);
    wasDraggingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    lastXRef.current = x;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  };

  const moveDrag = (x: number) => {
    if (!isDragging || !trackRef.current) return;
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    const dx = x - lastXRef.current;

    if (Math.abs(dx) > 3) {
      wasDraggingRef.current = true;
    }

    trackRef.current.scrollLeft -= dx;

    if (dt > 0) {
      // Piksele na milisekundę
      velocityRef.current = dx / dt;
    }

    lastXRef.current = x;
    lastTimeRef.current = now;
  };

  const endDrag = () => {
    setIsDragging(false);
    let v = velocityRef.current;

    // Ignoruj bardzo małe rzędy wielkości
    if (Math.abs(v) < 0.1) return;

    const step = () => {
      if (!trackRef.current) return;

      trackRef.current.scrollLeft -= v * 16; // 16ms dla 60fps
      v *= 0.95; // Wygaszanie pędu (tarcie)

      // Wywołujemy scroll manualnie, bo animacja z requestAnimationFrame
      // może nie wyzwolić natywnego zdarzenia z odpowiednią częstotliwością
      handleScroll();

      if (Math.abs(v) > 0.05) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.pageX);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // zapobiega selekcji
    moveDrag(e.pageX);
  };
  const handleMouseLeave = () => {
    if (isDragging) endDrag();
  };
  const handleMouseUp = () => {
    if (isDragging) endDrag();
  };

  const handleTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].pageX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    moveDrag(e.touches[0].pageX);
  };
  const handleTouchEnd = () => {
    if (isDragging) endDrag();
  };

  const handleScroll = () => {
    if (!trackRef.current) return;
    const track = trackRef.current;

    if (window.innerWidth < 1024) {
      // Obliczamy kropkę na mobilkach na podstawie scrolla
      const index = Math.round(track.scrollLeft / track.clientWidth);
      setActiveIndex(index);
      return;
    }

    const singleSetWidth = track.scrollWidth / 7;

    if (track.scrollLeft < singleSetWidth) {
      track.scrollLeft += singleSetWidth * 3;
    }
    else if (track.scrollLeft > singleSetWidth * 5) {
      track.scrollLeft -= singleSetWidth * 3;
    }
  };

  const handleImageClick = (imgSrc: string) => {
    if (wasDraggingRef.current) return;
    if (window.innerWidth >= 1024) {
      setLightboxImage(imgSrc);
    }
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  return (
    <div 
      className="recipe-hero-container" 
      style={{ "--char-count": title.length } as React.CSSProperties}
    >

      <div className="recipe-hero-header">
        <div className="recipe-hero-date">{formattedDate}</div>
        <h1 className="recipe-hero-title" data-pagefind-meta="title">{title}</h1>
      </div>

      <div className="hero-carousel-wrapper full-bleed">
        <div 
          className={`hero-carousel-track ${isDragging ? 'is-dragging' : ''}`}
          style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease' }}
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={handleScroll}
        >
          {displayImages.map((img, idx) => (
            <img
              key={idx}
              id={!isMobileState && idx === baseImages.length * 3 ? 'hero-carousel-center-img' : undefined}
              src={urlFor(img).height(800).format("webp").url()}
              alt={`Zdjęcie z przepisu`}
              className="hero-carousel-image"
              draggable={false}
              loading="eager"
              fetchpriority="high"
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => handleImageClick(urlFor(img).height(1200).format("webp").url())}
            />
          ))}
        </div>

        {isMobileState && baseImages.length > 1 && (
          <div className="hero-carousel-dots">
            {baseImages.map((_, idx) => (
              <span
                key={idx}
                className={`hero-carousel-dot ${idx === activeIndex ? 'is-active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {tags && tags.length > 0 && (
        <div className="hero-carousel-tags">
          {tags.map((tag) => (
            <a
              key={tag.name}
              href={`/przepisy?q=${encodeURIComponent(tag.name)}&mode=AND`}
              className="hero-carousel-tag"
            >
              {tag.name}
            </a>
          ))}
        </div>
      )}

      {lightboxImage && (
        <div className="hero-lightbox" onClick={closeLightbox}>
          <button className="hero-lightbox-close" onClick={closeLightbox}>✕</button>
          <img 
            src={lightboxImage} 
            alt="Powiększone zdjęcie" 
            onClick={(e) => e.stopPropagation()} 
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}
      
    </div>
  );
}

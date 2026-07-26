import React, { useRef, useState } from "react";
import { formatDateShort } from "../utils/formatDate";
import { urlFor } from "../lib/sanity";
import "./PostCard.scss";

interface PostCardProps {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  mainImage: any;
  gallery?: any[];
}

export default function PostCard({ slug, title, date, excerpt, mainImage, gallery }: PostCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const postUrl = `/przepisy/${slug}`;

  const images = [mainImage];
  if (gallery && gallery.length > 0) {
    images.push(...gallery);
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.clientWidth;
      const index = Math.round(scrollLeft / width);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  const scrollPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -scrollContainerRef.current.clientWidth, behavior: "smooth" });
    }
  };

  const scrollNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollContainerRef.current.clientWidth, behavior: "smooth" });
    }
  };

  const imageUrl = mainImage
    ? urlFor(mainImage).width(600).height(600).format("webp").url()
    : null;

  return (
    <article className="post-card">
      <div className="post-card__image-container">
        {images.length > 1 ? (
          <>
            <a href={postUrl} className="post-card__image-link" aria-label={`Przeczytaj: ${title}`}>
              <div
                className="post-card__carousel"
                ref={scrollContainerRef}
                onScroll={handleScroll}
              >
                {images.map((img, idx) => (
                  <div className="post-card__slide" key={idx}>
                    {img ? (
                      <img
                        src={urlFor(img).width(600).height(600).format("webp").url()}
                        alt={img.alt || title}
                        className="post-card__image"
                        loading="lazy"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <div className="post-card__image" style={{ background: "var(--color-surface)" }} />
                    )}
                  </div>
                ))}
              </div>
            </a>
            <div className="post-card__arrows">
              <button
                type="button"
                className="post-card__arrow post-card__arrow--prev"
                onClick={scrollPrev}
                aria-label="Poprzednie zdjęcie"
                disabled={activeIndex === 0}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button
                type="button"
                className="post-card__arrow post-card__arrow--next"
                onClick={scrollNext}
                aria-label="Następne zdjęcie"
                disabled={activeIndex === images.length - 1}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
            <div className="post-card__indicators">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`post-card__dot ${idx === activeIndex ? "is-active" : ""}`}
                />
              ))}
            </div>
          </>
        ) : imageUrl ? (
          <a href={postUrl} className="post-card__image-link" aria-label={`Przeczytaj: ${title}`}>
            <img
              src={imageUrl}
              alt={title}
              className="post-card__image"
              loading="lazy"
              onContextMenu={(e) => e.preventDefault()}
            />
          </a>
        ) : (
          <a href={postUrl} className="post-card__image-link" aria-label={`Przeczytaj: ${title}`}>
            <div className="post-card__image" style={{ background: "var(--color-surface)" }} />
          </a>
        )}
      </div>

      <a href={postUrl} className="post-card__content-link" aria-label={`Przeczytaj: ${title}`}>
        <div className="post-card__content">
          <div className="post-card__meta">
            <h3 className="post-card__title">{title}</h3>
            <time className="post-card__date" dateTime={date}>
              {formatDateShort(date)}
            </time>
          </div>
          {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        </div>
      </a>
    </article>
  );
}

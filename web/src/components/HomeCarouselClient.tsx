import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { urlFor } from "../lib/sanity";
import "./HomeCarouselClient.scss";

interface Post {
    _id: string;
    title: string;
    slug: { current: string };
    publishedAt: string;
    mainImage: any;
    carouselImageLight?: any;
    carouselImageDark?: any;
    featuredForCarouselLight?: boolean;
    featuredForCarouselDark?: boolean;
}

interface Props {
    posts: Post[];
}

function formatDate(dateStr: string) {
    const dateObj = new Date(dateStr);
    return `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`;
}

const customSmoothScrollTo = (track: HTMLElement, targetLeft: number, duration: number) => {
    const startLeft = track.scrollLeft;
    const distance = targetLeft - startLeft;
    const startTime = performance.now();

    track.style.scrollSnapType = 'none';

    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        track.scrollLeft = startLeft + distance * easeInOutCubic(progress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (window.innerWidth < 1024) {
                track.style.scrollSnapType = 'x mandatory';
            }
        }
    };
    requestAnimationFrame(animate);
};

interface TrackProps {
    posts: Post[];
    mode: 'light' | 'dark';
    onSyncScroll?: (scrollLeft: number) => void;
}

const CarouselTrack = forwardRef<HTMLDivElement, TrackProps>(({ posts, mode, onSyncScroll }, ref) => {
    if (!posts || posts.length === 0) return null;

    const trackRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => trackRef.current as HTMLDivElement);

    const [activeIndex, setActiveIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const startX = useRef(0);
    const wasDraggingRef = useRef(false);
    const N = posts.length;

    const displayPosts = [...posts, ...posts, ...posts, ...posts, ...posts];

    const trackId = `track-${mode}`;

    const handleScroll = () => {
        const track = trackRef.current;
        if (!track) return;

        if (onSyncScroll) {
            onSyncScroll(track.scrollLeft);
        }

        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let closestIndex = 0;
        let minDistance = Infinity;

        Array.from(track.children).forEach((child, i) => {
            const childCenter = (child as HTMLElement).offsetLeft + child.clientWidth / 2;
            const distance = Math.abs(childCenter - trackCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        });

        setActiveIndex(closestIndex % N);

        const firstItem = track.children[0] as HTMLElement;
        const nextSetItem = track.children[N] as HTMLElement;
        if (!firstItem || !nextSetItem) return;

        const singleSetWidth = nextSetItem.offsetLeft - firstItem.offsetLeft;

        if (track.scrollLeft < singleSetWidth) {
            track.style.scrollBehavior = 'auto';
            track.style.scrollSnapType = 'none';
            track.scrollLeft += singleSetWidth * 2;
            setTimeout(() => {
                if (track && !isDragging && window.innerWidth < 1024) {
                    track.style.scrollSnapType = 'x mandatory';
                }
            }, 50);
        } else if (track.scrollLeft > singleSetWidth * 3) {
            track.style.scrollBehavior = 'auto';
            track.style.scrollSnapType = 'none';
            track.scrollLeft -= singleSetWidth * 2;
            setTimeout(() => {
                if (track && !isDragging && window.innerWidth < 1024) {
                    track.style.scrollSnapType = 'x mandatory';
                }
            }, 50);
        }
    };

    const rafRef = useRef<number | null>(null);
    const velocityRef = useRef(0);
    const lastTimeRef = useRef(0);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        const visibleClones = new Map<Element, boolean>();

        const updateVisibility = () => {
            const allItems = Array.from(track.querySelectorAll('.carousel-item'));
            const idxVisibility = new Map<string, boolean>();

            allItems.forEach(item => {
                const postIdx = item.getAttribute('data-post-idx');
                if (postIdx && visibleClones.get(item)) {
                    idxVisibility.set(postIdx, true);
                }
            });

            const applyVisibility = (itemsNodeList: NodeListOf<Element>) => {
                itemsNodeList.forEach(item => {
                    const postIdx = item.getAttribute('data-post-idx');
                    if (postIdx && idxVisibility.get(postIdx)) {
                        item.classList.add('is-visible');
                    } else {
                        item.classList.remove('is-visible');
                    }
                });
            };

            applyVisibility(track.querySelectorAll('.carousel-item'));

            if (darkTrackRef.current) {
                applyVisibility(darkTrackRef.current.querySelectorAll('.carousel-item'));
            }
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                visibleClones.set(entry.target, entry.isIntersecting && entry.intersectionRatio >= 0.80);
            });
            updateVisibility();
        }, {
            root: track,
            threshold: [0, 0.80]
        });

        const items = track.querySelectorAll('.carousel-item');
        items.forEach(item => observer.observe(item));

        return () => observer.disconnect();
    }, [N]);

    const onMouseDown = (e: React.MouseEvent) => {
        if (window.innerWidth < 1024) return;
        e.preventDefault();
        setIsDragging(true);
        wasDraggingRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        startX.current = e.pageX;
        lastTimeRef.current = Date.now();
        velocityRef.current = 0;

        if (trackRef.current) {
            trackRef.current.style.scrollBehavior = 'auto';
            trackRef.current.style.scrollSnapType = 'none';
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const onGlobalMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const x = e.pageX;
            const now = Date.now();
            const dt = now - lastTimeRef.current;
            const dx = x - startX.current;

            if (Math.abs(dx) > 3) {
                wasDraggingRef.current = true;
            }

            if (trackRef.current) {
                trackRef.current.scrollLeft -= dx;
            }

            if (dt > 0) {
                velocityRef.current = dx / dt;
            }

            startX.current = x;
            lastTimeRef.current = now;
        };

        const onGlobalMouseUp = () => {
            setIsDragging(false);

            let v = velocityRef.current;
            if (Math.abs(v) < 0.1) {
                setTimeout(() => { wasDraggingRef.current = false; }, 50);
                return;
            }

            const step = () => {
                if (!trackRef.current) return;
                trackRef.current.scrollLeft -= v * 16;
                v *= 0.95;

                handleScroll();

                if (Math.abs(v) > 0.05) {
                    rafRef.current = requestAnimationFrame(step);
                } else {
                    setTimeout(() => { wasDraggingRef.current = false; }, 50);
                }
            };
            rafRef.current = requestAnimationFrame(step);
        };

        window.addEventListener('mousemove', onGlobalMouseMove);
        window.addEventListener('mouseup', onGlobalMouseUp);

        return () => {
            window.removeEventListener('mousemove', onGlobalMouseMove);
            window.removeEventListener('mouseup', onGlobalMouseUp);
        };
    }, [isDragging]);

    const snapToNearestOffset = (offsetDir: number) => {
        const track = trackRef.current;
        if (!track) return;
        const trackCenter = track.scrollLeft + track.clientWidth / 2;
        let closestIndex = 0;
        let minDistance = Infinity;
        Array.from(track.children).forEach((child, i) => {
            const childCenter = (child as HTMLElement).offsetLeft + child.clientWidth / 2;
            const distance = Math.abs(childCenter - trackCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        });

        const targetIndex = closestIndex + offsetDir;
        if (targetIndex >= 0 && targetIndex < track.children.length) {
            const targetItem = track.children[targetIndex] as HTMLElement;
            const targetScrollLeft = targetItem.offsetLeft + targetItem.clientWidth / 2 - track.clientWidth / 2;
            customSmoothScrollTo(track, targetScrollLeft, 800);
        }
    };

    const scrollPrev = () => snapToNearestOffset(-1);
    const scrollNext = () => snapToNearestOffset(1);

    const handleLinkClick = (e: React.MouseEvent) => {
        if (wasDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div className={`carousel-track-container track-${mode}`}>
            <button className="carousel-arrow left" onClick={scrollPrev} aria-label="Poprzednie zdjęcie">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            <div
                id={trackId}
                className={`carousel-track ${isDragging ? 'is-dragging' : ''}`}
                ref={trackRef}
                onScroll={handleScroll}
                onMouseDown={onMouseDown}
            >
                {displayPosts.map((post, idx) => {
                    const imageSrc = mode === 'light'
                        ? (post.carouselImageLight || post.mainImage)
                        : (post.carouselImageDark || post.mainImage);

                    const imgUrl = urlFor(imageSrc).width(900).height(450).format("webp").url();

                    return (
                        <div
                            key={`${idx}-${post._id}`}
                            className="carousel-item"
                            data-post-idx={idx % N}
                        >
                            <a href={`/przepisy/${post.slug.current}`} onClickCapture={handleLinkClick} className="carousel-item-link" draggable={false}>
                                <div className="carousel-item-info">
                                    <div className="date">{formatDate(post.publishedAt)}</div>
                                    <h2 className="title">{post.title}</h2>
                                </div>
                                <div className="carousel-item-image-wrapper">
                                    <img src={imgUrl} alt={post.title} loading={idx >= N && idx <= N * 3 ? "eager" : "lazy"} draggable={false} />
                                </div>
                            </a>
                        </div>
                    );
                })}
            </div>
            
            <script dangerouslySetInnerHTML={{ __html: `
                (function() {
                    var track = document.getElementById('${trackId}');
                    if (track && track.children.length > ${N} * 2) {
                        var centerItem = track.children[${N} * 2];
                        track.style.scrollSnapType = 'none';
                        track.scrollLeft = centerItem.offsetLeft + centerItem.clientWidth / 2 - track.clientWidth / 2;
                        requestAnimationFrame(function() {
                            track.style.scrollSnapType = '';
                        });
                    }
                })();
            `}} />

            <button className="carousel-arrow right" onClick={scrollNext} aria-label="Następne zdjęcie">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>

            <div className="carousel-dots">
                {posts.map((_, idx) => (
                    <span key={idx} className={`dot ${idx === activeIndex ? 'active' : ''}`} />
                ))}
            </div>
        </div>
    );
});

export default function HomeCarouselClient({ posts }: Props) {
    const lightPosts = posts.filter(p => p.featuredForCarouselLight);
    const darkPosts = posts.filter(p => p.featuredForCarouselDark);

    const lightTrackRef = useRef<HTMLDivElement>(null);
    const darkTrackRef = useRef<HTMLDivElement>(null);
    const syncLock = useRef(false);
    const lastSource = useRef<'light' | 'dark' | null>(null);
    const syncTimeout = useRef<any>(null);

    const handleSyncScroll = (source: 'light' | 'dark', scrollLeft: number) => {
        if (syncLock.current && lastSource.current !== source) return;

        syncLock.current = true;
        lastSource.current = source;

        if (source === 'light' && darkTrackRef.current) {
            if (darkTrackRef.current.scrollLeft !== scrollLeft) {
                darkTrackRef.current.scrollLeft = scrollLeft;
            }
        } else if (source === 'dark' && lightTrackRef.current) {
            if (lightTrackRef.current.scrollLeft !== scrollLeft) {
                lightTrackRef.current.scrollLeft = scrollLeft;
            }
        }

        if (syncTimeout.current) clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            syncLock.current = false;
            lastSource.current = null;
        }, 100);
    };

    return (
        <div className="home-carousel-wrapper full-bleed">
            {lightPosts.length > 0 && (
                <CarouselTrack
                    posts={lightPosts}
                    mode="light"
                    ref={lightTrackRef}
                    onSyncScroll={(sl) => handleSyncScroll('light', sl)}
                />
            )}
            {darkPosts.length > 0 && (
                <CarouselTrack
                    posts={darkPosts}
                    mode="dark"
                    ref={darkTrackRef}
                    onSyncScroll={(sl) => handleSyncScroll('dark', sl)}
                />
            )}
        </div>
    );
}

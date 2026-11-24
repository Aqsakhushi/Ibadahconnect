// IbadahConnect - Netflix-style horizontal slider Row
// Depends on: ./PackageCard.jsx (FILE 2/4)
// Used by: ServicesNetflix page (FILE 4/4)

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import PackageCard from './PackageCard';

/* ------------------------------ CSS (injected once) ------------------------------ */

(function injectRowCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ibc-row-css')) return; // single-injection guard

  const style = document.createElement('style');
  style.id = 'ibc-row-css';
  style.textContent = `
    .ibc-row { max-width: 1280px; margin: 0 auto 34px; padding: 0 24px; }

    .ibc-row-head { display: flex; align-items: baseline; gap: 10px; margin: 0 0 12px 2px; }
    .ibc-row-title {
      position: relative; margin: 0; padding-left: 12px;
      color: #f5f5f7; font-size: 20px; font-weight: 700; letter-spacing: .2px;
    }
    .ibc-row-title::before {
      content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      width: 4px; height: 18px; border-radius: 2px;
      background: linear-gradient(180deg, #e6c15c, #b8860b);
    }
    .ibc-row-count { color: #8a8a93; font-size: 12px; font-weight: 500; }

    .ibc-slider-wrap { position: relative; }

    .ibc-slider {
      display: flex; gap: 16px;
      overflow-x: auto; scroll-snap-type: x proximity;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none; -ms-overflow-style: none;
      padding: 6px 2px 22px; /* room for hover scale + shadow */
    }
    .ibc-slider::-webkit-scrollbar { display: none; }

    .ibc-slide { flex: 0 0 80%; min-width: 0; scroll-snap-align: start; }
    @media (min-width: 560px)  { .ibc-slide { flex-basis: calc((100% - 16px) / 2); } }
    @media (min-width: 768px)  { .ibc-slide { flex-basis: calc((100% - 32px) / 3); } }
    @media (min-width: 992px)  { .ibc-slide { flex-basis: calc((100% - 48px) / 4); } }
    @media (min-width: 1200px) { .ibc-slide { flex-basis: calc((100% - 64px) / 5); } }

    .ibc-arrow {
      position: absolute; top: 0; bottom: 22px; width: 42px; z-index: 3;
      display: flex; align-items: center; justify-content: center;
      border: none; cursor: pointer; color: #ffffff;
      background: linear-gradient(90deg, rgba(10,10,12,.92), rgba(10,10,12,.55));
      opacity: 0; transition: opacity .25s ease, background .2s ease;
    }
    .ibc-arrow.ibc-arrow-left  { left: -6px; }
    .ibc-arrow.ibc-arrow-right { right: -6px; background: linear-gradient(270deg, rgba(10,10,12,.92), rgba(10,10,12,.55)); }
    .ibc-slider-wrap:hover .ibc-arrow:not(:disabled) { opacity: 1; }
    .ibc-arrow:hover:not(:disabled) { background: rgba(212,175,55,.9); color: #101014; }
    .ibc-arrow:disabled { opacity: 0 !important; cursor: default; }
    .ibc-arrow svg { font-size: 22px; pointer-events: none; }

    /* Touch devices / small screens: swipe only, no arrows */
    @media (max-width: 767px), (hover: none) { .ibc-arrow { display: none; } }
  `;
  document.head.appendChild(style);
})();

/* --------------------------------- Component --------------------------------- */

/**
 * Row - one Netflix-style horizontal slider section.
 * Expects `row` shaped like buildRows() output:
 *   { id, title, items: [pkg...], badgeFrom?: number }
 * badgeFrom=1 (Popular row) => card rank = badgeFrom + index; PackageCard
 * shows the big number badge only for rank 1..5.
 *
 * Props:
 *   row          row object (required)
 *   savedIds     Set or Array of package ids in My List (optional)
 *   onToggleSave (pkg) => void, passed to PackageCard (optional)
 *   onAddToCart  (pkg) => void, passed to PackageCard (optional; card has storage fallback)
 *   onOpen       (pkg) => void, passed to PackageCard (optional; card navigates by default)
 */
export default function Row({ row, savedIds, onToggleSave, onAddToCart, onOpen }) {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const items = row && Array.isArray(row.items) ? row.items : [];
  const badgeFrom = row && typeof row.badgeFrom === 'number' ? row.badgeFrom : null;

  // Tolerant: accept Set or Array for savedIds
  const savedLookup =
    Array.isArray(savedIds) ? new Set(savedIds.map(String)) : savedIds || null;

  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    syncEdges();
    const el = scrollerRef.current;
    if (!el) return undefined;
    const onResize = () => syncEdges();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [syncEdges, items.length]);

  const nudge = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.85, 240);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!items.length) return null; // buildRows already filters empty rows, this is a guard

  return (
    <section className="ibc-row">
      <div className="ibc-row-head">
        <h2 className="ibc-row-title">{row.title}</h2>
        <span className="ibc-row-count">
          {items.length} {items.length === 1 ? 'package' : 'packages'}
        </span>
      </div>

      <div className="ibc-slider-wrap">
        <button
          type="button"
          className="ibc-arrow ibc-arrow-left"
          aria-label="Scroll left"
          disabled={!canLeft}
          onClick={() => nudge(-1)}
        >
          <FaChevronLeft />
        </button>

        <div className="ibc-slider" ref={scrollerRef} onScroll={syncEdges}>
          {items.map((pkg, i) => {
            const pkgId = String(pkg._id || pkg.id || '');
            return (
              <div className="ibc-slide" key={pkg._id || pkg.id || `row-${i}`}>
                <PackageCard
                  pkg={pkg}
                  rank={badgeFrom ? badgeFrom + i : undefined}
                  saved={savedLookup ? savedLookup.has(pkgId) : false}
                  onToggleSave={onToggleSave}
                  onAddToCart={onAddToCart}
                  onOpen={onOpen}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="ibc-arrow ibc-arrow-right"
          aria-label="Scroll right"
          disabled={!canRight}
          onClick={() => nudge(1)}
        >
          <FaChevronRight />
        </button>
      </div>
    </section>
  );
}
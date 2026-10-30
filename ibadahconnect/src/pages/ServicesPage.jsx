// ============================================================
// IbadahConnect — src/pages/ServicesPage.jsx (NEW FILE)
// ------------------------------------------------------------
// NETFLIX-STYLE CATALOG (Ma'am ki demand):
//   - Sticky instant search (300ms debounce + URL sync ?q=&cat=)
//   - Seasonal spotlight hero (Ramadan/Hajj/Eid auto)
//   - Category chips (All / Umrah / Hajj / 5 donation groups)
//   - Horizontal rows: scroll-snap + hover arrows + no scrollbar
//   - ServiceCard: 16:9 image, hover reveal, My List heart,
//     Popular badge + Netflix-style top-5 rank numbers
//   - Rows: Saved -> Popular -> Umrah -> Hajj -> 5 sub-category
//     rows -> Under PKR 5,000
// Self-contained: Card/Row/Search sab isi file me hain.
// Data: GET /api/packages/all (subCategory backend se aati hai)
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight,
  FaSearch, FaTimes, FaFire,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ---------------- CONFIG ----------------
const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';
const MYLIST_KEY = 'ibadah_mylist';

const POPULAR_TITLES = [
  'Ajwa Dates', 'Zamzam for Pilgrims', 'Eid Gift Bundle', 'Economy Umrah Badal',
  'Orphan Sponsorship', 'Donate Iftar in Mecca', 'Premium Umrah Badal', 'Quran Donation in Mecca',
];
const POPULAR_SEARCHES = ['Iftar', 'Zamzam', 'Orphan', 'Eid', 'Quran'];
const CHIPS = [
  'All', 'Umrah Badal', 'Hajj Badal', 'Water & Iftar', 'Quran & Ibadah',
  'Orphans, Widows & Families', 'Care & Comfort', 'Sadaqah Jariya & Special',
];

const SEASONS = [
  { months: [2, 3], title: 'Ramadan Kareem', line: 'Sponsor an Iftar in Makkah', pkg: 'Donate Iftar in Mecca' },
  { months: [4, 5], title: 'Season of Hajj', line: 'Send your Hajj Badal — proof at every rite', pkg: 'Economy Hajj Badal' },
  { months: [9, 10], title: 'Eid Mubarak', line: 'Send gifts to the orphans of Makkah', pkg: 'Eid Gift Bundle' },
  { months: [], title: 'Sadaqah Jariya', line: 'A reward that never stops', pkg: 'Sadaqah Jariya Bundle' },
];

// ---------------- HELPERS ----------------
function money(n) {
  return 'PKR ' + Number(n || 0).toLocaleString('en-US');
}
function imgSrc(p) {
  if (!p) return '';
  const s = String(p);
  return s.startsWith('/uploads') ? API_BASE + s : s;
}
function pickSeason() {
  const m = new Date().getMonth();
  return SEASONS.find((s) => s.months.includes(m)) || SEASONS[SEASONS.length - 1];
}
function readMyList() {
  try { return JSON.parse(localStorage.getItem(MYLIST_KEY)) || []; } catch (e) { return []; }
}
function writeMyList(ids) {
  try { localStorage.setItem(MYLIST_KEY, JSON.stringify(ids)); } catch (e) { /* ignore */ }
}
async function fetchPackages() {
  // dono tareeqe try: direct backend URL, phir relative (agar Vite proxy ho)
  const tries = [`${API_BASE}/api/packages/all`, '/api/packages/all'];
  let lastErr = null;
  for (const url of tries) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.packages || []);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Packages load failed');
}

// ---------------- GLOBAL CSS (scrollbar/clamp/rank) ----------------
function PageStyles() {
  return (
    <style>{`
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .rank-num { -webkit-text-stroke: 2px #064e3b; paint-order: stroke fill; }
    `}</style>
  );
}

// ---------------- SKELETON ----------------
function SkeletonCard() {
  return (
    <div className="w-[210px] shrink-0 sm:w-[250px]">
      <div className="aspect-video animate-pulse rounded-xl bg-gray-200" />
      <div className="mt-3 h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
function SkeletonRow() {
  return (
    <section className="py-4">
      <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
      </div>
    </section>
  );
}

// ---------------- SERVICE CARD ----------------
function ServiceCard({ pkg, saved, onToggleSave, rank, fluid }) {
  return (
    <Link
      to={`/service/${pkg._id}`}
      className={`group relative block rounded-xl transition-all duration-300 hover:z-20 hover:scale-[1.05] hover:shadow-2xl focus:outline-none ${
        fluid ? 'w-full' : 'w-[210px] shrink-0 snap-start sm:w-[250px]'
      }`}
    >
      {rank ? (
        <span className="rank-num absolute -left-2 -top-3 z-10 select-none text-5xl font-black text-white">
          {rank}
        </span>
      ) : null}

      <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200">
        <img
          src={imgSrc(pkg.image)}
          alt={pkg.title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        {pkg.popular ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            <FaFire className="text-amber-400" /> Popular
          </span>
        ) : null}

        <button
          type="button"
          aria-label="My List"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(pkg); }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/80"
        >
          {saved ? <FaHeart className="text-rose-500" /> : <FaRegHeart />}
        </button>

        {/* hover reveal — chhupa hua desc + CTA */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 max-h-0 overflow-hidden bg-gradient-to-t from-black/85 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:max-h-28 group-hover:opacity-100">
          <p className="clamp-2 text-[11px] leading-snug text-gray-200">{pkg.desc}</p>
          <span className="mt-1 inline-block text-[11px] font-bold text-emerald-300">View Details</span>
        </div>
      </div>

      <div className="px-0.5 pt-2">
        <h3 className="clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-gray-900">{pkg.title}</h3>
        <p className="mt-0.5 text-sm font-bold text-amber-600">{money(pkg.price)}</p>
      </div>
    </Link>
  );
}

// ---------------- CATEGORY ROW (slider) ----------------
function CategoryRow({ title, subtitle, items, myList, onToggleSave, ranked, onSeeAll }) {
  const ref = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return undefined;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, items && items.length]);

  const scrollByDir = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth - 120, 240), behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="group/row relative py-4">
      <div className="mb-2 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 sm:text-xl">{title}</h2>
          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            See all
          </button>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByDir(-1)}
          className={`absolute left-0 top-0 z-30 hidden h-full w-10 items-center justify-center rounded-l-xl bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/60 md:flex ${
            atStart ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover/row:opacity-100'
          }`}
        >
          <FaChevronLeft />
        </button>

        <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {items.map((p, i) => (
            <ServiceCard
              key={p._id || i}
              pkg={p}
              saved={myList.includes(p._id)}
              onToggleSave={onToggleSave}
              rank={ranked && i < 5 ? i + 1 : null}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByDir(1)}
          className={`absolute right-0 top-0 z-30 hidden h-full w-10 items-center justify-center rounded-r-xl bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/60 md:flex ${
            atEnd ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover/row:opacity-100'
          }`}
        >
          <FaChevronRight />
        </button>
      </div>
    </section>
  );
}

// ---------------- MAIN PAGE ----------------
export default function ServicesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState(''); // debounced
  const [myList, setMyList] = useState(readMyList());
  const [scrolled, setScrolled] = useState(false);
  const [params, setParams] = useSearchParams();

  const chip = params.get('cat') || 'All';

  // load packages once
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const data = await fetchPackages();
        if (live) setPackages(data);
      } catch (e) {
        if (live) setError('Packages load nahi huay — backend (port 5000) chal raha hai?');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  // URL ?q= -> input (sirf pehli mount par)
  useEffect(() => {
    const q = params.get('q');
    if (q) setRawQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 300ms debounce
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // URL sync for q (shareable search)
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (query) next.set('q', query); else next.delete('q');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // compact header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const setChip = (c) => {
    const next = new URLSearchParams(params);
    if (c === 'All') next.delete('cat'); else next.set('cat', c);
    setParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSave = (pkg) => {
    setMyList((prev) => {
      let next;
      if (prev.includes(pkg._id)) {
        next = prev.filter((x) => x !== pkg._id);
        toast('Removed from My List');
      } else {
        next = [pkg._id, ...prev];
        toast('Saved to My List');
      }
      writeMyList(next);
      return next;
    });
  };

  // -------- derived data --------
  const byTitle = useMemo(() => new Map(packages.map((p) => [p.title, p])), [packages]);

  const popular = useMemo(() => {
    const picks = POPULAR_TITLES.map((t) => byTitle.get(t)).filter(Boolean);
    if (picks.length >= 6) return picks.slice(0, 8);
    const rest = packages.filter((p) => !picks.includes(p));
    return [...picks, ...rest].slice(0, 8);
  }, [packages, byTitle]);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return null;
    return packages.filter((p) =>
      [p.title, p.desc, p.category, p.subCategory].some(
        (v) => String(v || '').toLowerCase().includes(q)
      )
    );
  }, [packages, query]);

  const umrah = packages.filter((p) => String(p.category || '').toLowerCase().includes('umrah'));
  const hajj = packages.filter((p) => String(p.category || '').toLowerCase().includes('hajj'));
  const donations = packages.filter((p) => String(p.category || '').toLowerCase().includes('donation'));
  const sub = (name) => donations.filter((p) => p.subCategory === name);
  const budget = packages.filter((p) => Number(p.price) <= 5000);
  const savedItems = myList.map((id) => packages.find((p) => p._id === id)).filter(Boolean);

  const umrahMin = umrah.length ? money(Math.min(...umrah.map((p) => Number(p.price)))) : '';
  const hajjMin = hajj.length ? money(Math.min(...hajj.map((p) => Number(p.price)))) : '';

  const season = pickSeason();
  const featured = byTitle.get(season.pkg) || packages[0];

  // -------- rows (chip-aware, data-driven) --------
  const rows = [];
  if (!results) {
    if (chip === 'All') {
      if (savedItems.length) rows.push({ key: 'saved', title: 'Your Saved Sadaqah', items: savedItems });
      rows.push({ key: 'popular', title: 'Popular This Week', items: popular.map((p) => ({ ...p, popular: true })), ranked: true });
      if (umrah.length) rows.push({ key: 'umrah', title: 'Umrah Badal', subtitle: umrahMin ? `from ${umrahMin}` : '', items: umrah, onSeeAll: () => setChip('Umrah Badal') });
      if (hajj.length) rows.push({ key: 'hajj', title: 'Hajj Badal', subtitle: hajjMin ? `from ${hajjMin}` : '', items: hajj, onSeeAll: () => setChip('Hajj Badal') });
      const subRows = [
        { key: 'water', title: 'Water & Iftar', items: sub('Water & Iftar') },
        { key: 'quran', title: 'Quran & Ibadah', items: sub('Quran & Ibadah') },
        { key: 'orphans', title: 'Orphans, Widows & Families', items: sub('Orphans, Widows & Families') },
        { key: 'care', title: 'Care & Comfort', items: sub('Care & Comfort') },
        { key: 'jariya', title: 'Sadaqah Jariya & Special', items: sub('Sadaqah Jariya & Special') },
      ];
      subRows.forEach((r) => { if (r.items.length) rows.push(r); });
      if (budget.length) rows.push({ key: 'budget', title: 'Under PKR 5,000', subtitle: 'Small sadaqah, big reward', items: budget });
    } else if (chip === 'Umrah Badal') {
      rows.push({ key: 'umrah', title: 'Umrah Badal', items: umrah });
    } else if (chip === 'Hajj Badal') {
      rows.push({ key: 'hajj', title: 'Hajj Badal', items: hajj });
    } else {
      const map = {
        'Water & Iftar': 'Water & Iftar',
        'Quran & Ibadah': 'Quran & Ibadah',
        'Orphans, Widows & Families': 'Orphans, Widows & Families',
        'Care & Comfort': 'Care & Comfort',
        'Sadaqah Jariya & Special': 'Sadaqah Jariya & Special',
      };
      const name = map[chip];
      if (name) rows.push({ key: name, title: name, items: sub(name) });
    }
  }

  return (
    <div className="min-h-screen bg-white pb-16 font-outfit">
      <PageStyles />

      {/* STICKY SEARCH HEADER */}
      <header
        className={`sticky top-16 z-40 border-b transition-all ${
          scrolled ? 'border-gray-200 bg-white/90 shadow-sm backdrop-blur' : 'border-transparent bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Search sadaqah, Umrah, Hajj..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm outline-none focus:border-emerald-600 focus:bg-white"
            />
            {rawQuery ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setRawQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            ) : null}
          </div>
        </div>

        {/* popular search chips — khali search par */}
        {!rawQuery ? (
          <div className="no-scrollbar mx-auto flex max-w-[1280px] gap-2 overflow-x-auto px-4 pb-2">
            <span className="self-center whitespace-nowrap text-xs text-gray-400">Popular:</span>
            {POPULAR_SEARCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRawQuery(s)}
                className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {/* CATEGORY CHIPS */}
      <div className="no-scrollbar mx-auto flex max-w-[1280px] gap-2 overflow-x-auto px-4 py-3">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChip(c)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              chip === c
                ? 'bg-emerald-800 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* SPOTLIGHT HERO */}
      {!results && chip === 'All' && featured ? (
        <section className="mx-4 sm:mx-auto sm:max-w-[1280px]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 p-6 sm:p-10">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">{season.title}</p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-white sm:text-4xl">{season.line}</h1>
              <p className="mt-2 text-sm text-emerald-100">
                {featured.title} — {money(featured.price)}
              </p>
              <Link
                to={`/service/${featured._id}`}
                className="mt-4 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-emerald-950 hover:bg-amber-300"
              >
                Donate Now
              </Link>
            </div>
            <img
              src={imgSrc(featured.image)}
              alt={featured.title}
              loading="lazy"
              className="absolute right-6 top-1/2 hidden h-44 w-64 -translate-y-1/2 rounded-xl object-cover shadow-2xl lg:block"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        </section>
      ) : null}

      {/* BODY */}
      <main className="mx-auto max-w-[1280px] px-4">
        {loading ? (
          <div>{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
        ) : error ? (
          <div className="my-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => { setError(null); setLoading(true); fetchPackages().then(setPackages).catch(() => setError('Load failed')).finally(() => setLoading(false)); }}
              className="mt-4 rounded-full bg-emerald-800 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        ) : results ? (
          // -------- SEARCH MODE --------
          <section className="py-4">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-gray-900">
                {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
              </h2>
              <button
                type="button"
                onClick={() => setRawQuery('')}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
              >
                <FaTimes /> Clear
              </button>
            </div>
            {results.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center">
                <p className="font-semibold text-gray-700">Kuch nahi mila — try these:</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {POPULAR_SEARCHES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRawQuery(s)}
                      className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {results.map((p) => (
                  <ServiceCard
                    key={p._id}
                    pkg={p}
                    fluid
                    saved={myList.includes(p._id)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          // -------- NETFLIX ROWS --------
          <div>
            {rows.map((row) => (
              <CategoryRow
                key={row.key}
                title={row.title}
                subtitle={row.subtitle}
                items={row.items}
                ranked={row.ranked}
                onSeeAll={row.onSeeAll}
                myList={myList}
                onToggleSave={toggleSave}
              />
            ))}
            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">No packages in this category yet.</p>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
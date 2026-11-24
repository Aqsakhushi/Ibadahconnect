// IbadahConnect - Netflix rows configuration (FILE 1/4 - rebuilt defensive version)
// Location: src/components/netflix/rowsConfig.js
// Used by: ServicesPage.jsx, PackageCard.jsx, Row.jsx

/* ------------------------------- constants ------------------------------- */

export const CATEGORY_CHIPS = [
  { id: 'umrah', label: 'Umrah Badal' },
  { id: 'hajj', label: 'Hajj Badal' },
  { id: 'donation', label: 'Donations' },
  { id: 'under5k', label: 'Under PKR 5,000' },
];

export const HOT_CHIPS = [
  { label: 'Iftar', q: 'Iftar' },
  { label: 'Zamzam', q: 'Zamzam' },
  { label: 'Orphan', q: 'Orphan' },
  { label: 'Eid', q: 'Eid' },
  { label: 'Quran', q: 'Quran' },
];

// 5 donation groups (row titles). Matching order:
// 1) DB subCategory value  2) title keywords  3) everything else -> Special group
export const DONATION_SUBCATEGORY = [
  {
    id: 'water-iftar',
    title: 'Water & Iftar',
    keywords: ['water', 'well', 'iftar', 'zamzam', 'thirst', 'roza', 'fasting', 'drink'],
  },
  {
    id: 'quran-ibadah',
    title: 'Quran & Ibadah',
    keywords: ['quran', 'quraan', 'ibadah', 'ibaadah', 'namaz', 'prayer', 'musallah', 'tasbih', 'imam', 'masjid', 'mosque'],
  },
  {
    id: 'orphans-widows',
    title: 'Orphans, Widows & Families',
    keywords: ['orphan', 'yateem', 'widow', 'family', 'families', 'sponsor', 'child', 'children', 'girl', 'boy'],
  },
  {
    id: 'care-comfort',
    title: 'Care & Comfort',
    keywords: ['care', 'comfort', 'blanket', 'wheelchair', 'medical', 'cloth', 'clothes', 'clothing', 'shelter', 'ration', 'food', 'meal', 'winter', 'summer'],
  },
  {
    id: 'sadaqah-special',
    title: 'Sadaqah Jariya & Special',
    keywords: ['sadaqah', 'sadqa', 'jariya', 'jaria', 'jaariya', 'special', 'eid', 'gift', 'aqiqah', 'aqiqa', 'aqeeqah', 'qurbani', 'tree', 'plant', 'general'],
  },
];

// Optional curated popular titles. Empty by default: the Popular row is
// data-driven (popularity/sales fields) with a cheapest-first fallback.
export const POPULAR_TITLES = [];

/* ------------------------------ small helpers ----------------------------- */

export function formatPKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 'PKR 0';
  return 'PKR ' + num.toLocaleString('en-PK');
}

const norm = (s) => String(s == null ? '' : s).toLowerCase().trim();

const pkgId = (p) => String((p && (p._id || p.id)) || '');

const priceOf = (p) => {
  if (!p) return Infinity;
  const raw = p.price != null ? p.price : (p.amount != null ? p.amount : p.cost);
  const n = Number(raw);
  return Number.isFinite(n) ? n : Infinity;
};

const imageOf = (p) => (p && (p.image || p.img || p.imageUrl || p.thumbnail)) || '';

/* --------------------------- category resolution --------------------------- */

export function categoryOf(pkg) {
  const p = pkg || {};
  const cat = norm(p.category || p.categoryName || p.type);
  const hay = cat || norm(p.title);
  if (hay.includes('umrah')) return 'umrah';
  if (hay.includes('hajj')) return 'hajj';
  return 'donation';
}

export function subCategoryOf(pkg) {
  const p = pkg || {};
  const raw = p.subCategory || p.subcategory || p.sub_category || p.group || '';
  const dbSub = norm(raw);
  if (dbSub) {
    const hit = DONATION_SUBCATEGORY.find((g) => {
      const t = norm(g.title);
      return t === dbSub || t.startsWith(dbSub) || dbSub.startsWith(t);
    });
    if (hit) return hit.title;
  }
  const title = norm(p.title);
  for (let i = 0; i < DONATION_SUBCATEGORY.length; i++) {
    const g = DONATION_SUBCATEGORY[i];
    if (g.keywords.some((k) => title.includes(k))) return g.title;
  }
  return 'Sadaqah Jariya & Special'; // catch-all so every donation lands in a row
}

/* ------------------------------- popular row ------------------------------- */

const POP_FIELDS = [
  'popularity', 'popular', 'sold', 'soldCount', 'sold_count',
  'ordersCount', 'orderCount', 'bookings', 'bookingCount',
  'sponsors', 'sponsorsCount', 'views', 'viewCount',
];

function popScore(p) {
  if (!p) return 0;
  for (let i = 0; i < POP_FIELDS.length; i++) {
    const n = Number(p[POP_FIELDS[i]]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function pickPopular(arr, max) {
  // 1) curated titles (if configured)
  if (POPULAR_TITLES.length) {
    const picked = [];
    for (let i = 0; i < POPULAR_TITLES.length; i++) {
      const t = norm(POPULAR_TITLES[i]);
      const hit = arr.find((p) => norm(p.title) === t);
      if (hit && !picked.includes(hit)) picked.push(hit);
      if (picked.length >= max) break;
    }
    if (picked.length) return picked;
  }
  // 2) data-driven by popularity/sales fields
  const scored = arr
    .filter((p) => popScore(p) > 0)
    .sort((a, b) => popScore(b) - popScore(a));
  if (scored.length) return scored.slice(0, max);

  // 3) fallback: cheapest Umrah, cheapest Hajj, then cheapest donations
  const umrah = arr.filter((p) => categoryOf(p) === 'umrah').sort((a, b) => priceOf(a) - priceOf(b));
  const hajj = arr.filter((p) => categoryOf(p) === 'hajj').sort((a, b) => priceOf(a) - priceOf(b));
  const dons = arr.filter((p) => categoryOf(p) === 'donation').sort((a, b) => priceOf(a) - priceOf(b));
  const out = [];
  const push = (p) => { if (p && out.length < max && !out.includes(p)) out.push(p); };
  push(umrah[0]);
  push(hajj[0]);
  dons.forEach(push);
  umrah.slice(1).forEach(push);
  hajj.slice(1).forEach(push);
  return out;
}

/* ------------------------------ search helpers ----------------------------- */

export function searchPackages(list, query) {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return (list || []).filter((p) => {
    const hay = norm([
      p && p.title,
      p && p.description,
      p && p.shortDescription,
      p && p.category,
      p && (p.subCategory || p.subcategory),
    ].join(' '));
    return tokens.every((t) => hay.includes(t));
  });
}

export function suggestTitles(list, query) {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < (list || []).length; i++) {
    const p = list[i];
    const title = String((p && p.title) || '').trim();
    const t = norm(title);
    if (!t) continue;
    if (tokens.some((w) => t.includes(w))) out.push(title);
    if (out.length >= 6) break;
  }
  return out;
}

/* ------------------------------ rows builder ------------------------------- */

export function filterByCategory(list, cat) {
  const arr = list || [];
  const c = norm(cat);
  if (!c || c === 'all') return arr;
  if (c === 'under5k' || c === 'under-5k' || c === 'under pkr 5,000') {
    return arr.filter((p) => priceOf(p) < 5000);
  }
  if (c === 'donation' || c === 'donations') {
    return arr.filter((p) => categoryOf(p) === 'donation');
  }
  return arr.filter((p) => categoryOf(p) === c);
}

export function spotlightPick(list) {
  const arr = (list || []).filter(Boolean);
  if (!arr.length) return null;
  const withImg = arr.filter((p) => imageOf(p));
  const pool = withImg.length ? withImg : arr;
  const umrah = pool.filter((p) => categoryOf(p) === 'umrah');
  const pool2 = umrah.length ? umrah : pool;
  let best = pool2[0];
  for (let i = 1; i < pool2.length; i++) {
    if (priceOf(pool2[i]) > priceOf(best)) best = pool2[i];
  }
  return best;
}

export function seasonLabel() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[new Date().getMonth()] + ' Spotlight';
}

export function buildRows(allPackages, savedIds) {
  const arr = (allPackages || []).filter(Boolean);
  const savedSet = savedIds instanceof Set
    ? savedIds
    : new Set((savedIds || []).map((x) => String(x)));
  const rows = [];

  // 1. My List
  const myList = arr.filter((p) => savedSet.has(pkgId(p)));
  if (myList.length) rows.push({ id: 'my-list', title: 'My List', items: myList });

  // 2. Popular (badges 1..5)
  const popular = pickPopular(arr, 10);
  if (popular.length) {
    rows.push({ id: 'popular', title: 'Popular on IbadahConnect', items: popular, badgeFrom: 1 });
  }

  // 3. Umrah Badal - price ascending
  const umrah = arr
    .filter((p) => categoryOf(p) === 'umrah')
    .sort((a, b) => priceOf(a) - priceOf(b));
  if (umrah.length) {
    rows.push({ id: 'umrah-badal', title: 'Umrah Badal - Economy to VIP', items: umrah });
  }

  // 4. Hajj Badal - price ascending
  const hajj = arr
    .filter((p) => categoryOf(p) === 'hajj')
    .sort((a, b) => priceOf(a) - priceOf(b));
  if (hajj.length) {
    rows.push({ id: 'hajj-badal', title: 'Hajj Badal - Economy to VIP', items: hajj });
  }

  // 5. Donation themed rows (fixed order)
  for (let i = 0; i < DONATION_SUBCATEGORY.length; i++) {
    const g = DONATION_SUBCATEGORY[i];
    const items = arr.filter((p) => categoryOf(p) === 'donation' && subCategoryOf(p) === g.title);
    if (items.length) rows.push({ id: 'donation-' + g.id, title: g.title, items });
  }

  // 6. Under PKR 5,000 - price ascending
  const under5k = arr
    .filter((p) => priceOf(p) < 5000)
    .sort((a, b) => priceOf(a) - priceOf(b));
  if (under5k.length) rows.push({ id: 'under-5k', title: 'Under PKR 5,000', items: under5k });

  return rows;
}
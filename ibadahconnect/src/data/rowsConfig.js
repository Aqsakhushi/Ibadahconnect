// ============================================================
// IbadahConnect — src/data/rowsConfig.js
// NETFLIX FRONTEND — FILE 1 of 4 (data / row configuration)
//
// Ma'am ki demand: 3 category portions, har portion ka apna slider:
//   1) Umrah Badal -> 10 packages ka slider (Economy -> VIP)
//   2) Hajj Badal  -> 10 packages ka slider (Economy -> VIP)
//   3) Donations   -> 28 packages = 5 themed sliders (neeche map)
// Plus blueprint rows: My List, Popular (top-5 badges), Under PKR 5,000.
//
// Data source: /api/packages/all (server.js v2.2 har donation par
// subCategory bhejta hai). Purane cached packages jo subCategory ke
// baghair hon, unke liye title-based fallback bhi yahan hai.
// ============================================================

// ---------- Donation sub-categories (EXACT 28 titles — server.js v2.2 match) ----------
export const DONATION_SUBCATEGORY = {
  'Water & Iftar': [
    'Donate Water in Makkah',
    'Donate Iftar in Mecca',
    'Iftar for Orphans',
    'Iftar for Haram Workers',
    'Feed a Pilgrim',
    'Hajj Food Donation',
    'Ab-e-Zamzam Delivery',
    'Zamzam for Pilgrims',
    'Water Coolers',
    'Ajwa Dates',
  ],
  'Quran & Ibadah': [
    'Quran Donation in Mecca',
    'Qurans for Madrasa',
    'Prayer Mat',
    'Tasbeeh Distribution',
    'Hijab & Ihram',
  ],
  'Orphans, Widows & Families': [
    'Orphan Sponsorship',
    'Widows of Makkah',
    'Roza Kushai',
    'Eid Gift Bundle',
    'Baraka Starter Bundle',
  ],
  'Care & Comfort': [
    'Wheelchair Donation in Mecca',
    'Wheelchair Repair',
    'Shoes & Slippers',
    'Winter Blankets',
    'Medical Aid',
  ],
  'Sadaqah Jariya & Special': [
    'Sadaqah Jariya Bundle',
    'Umrah for a Poor Pilgrim',
    'Kafan & Burial Fund',
  ],
};

// fast lookup: title -> group
const TITLE_TO_GROUP = {};
Object.keys(DONATION_SUBCATEGORY).forEach((group) => {
  DONATION_SUBCATEGORY[group].forEach((t) => {
    TITLE_TO_GROUP[t] = group;
  });
});

// Defensive: DB wali subCategory pehle, warna title se guess (purane cache ke liye)
export function subCategoryOf(pkg) {
  if (pkg && pkg.subCategory) return pkg.subCategory;
  const title = String((pkg && pkg.title) || '').trim();
  return TITLE_TO_GROUP[title] || null;
}

// ---------- Category detection (tolerant) ----------
export function categoryOf(pkg) {
  const c = String((pkg && pkg.category) || '').toLowerCase();
  if (c.includes('umrah')) return 'umrah';
  if (c.includes('hajj')) return 'hajj';
  if (c.includes('donation')) return 'donation';
  return 'other';
}

// ---------- Price label: PKR 1,350,000 ----------
export function formatPKR(price) {
  const n = Number(price) || 0;
  return 'PKR ' + n.toLocaleString('en-PK');
}

// ---------- Popular row (curated 10; pehle 5 par big number badges) ----------
export const POPULAR_TITLES = [
  'Umrah for a Poor Pilgrim',
  'Orphan Sponsorship',
  'Water Coolers',
  'Donate Iftar in Mecca',
  'Sadaqah Jariya Bundle',
  'Quran Donation in Mecca',
  'Wheelchair Donation in Mecca',
  'Eid Gift Bundle',
  'Ajwa Dates',
  'Economy Umrah Badal',
];

// ---------- Hot search chips (sticky header ke liye) ----------
export const HOT_CHIPS = [
  { label: 'Iftar', match: (p) => /iftar/i.test(p.title || '') },
  { label: 'Zamzam', match: (p) => /zamzam/i.test(p.title || '') },
  { label: 'Orphan', match: (p) => /orphan/i.test(p.title || '') },
  { label: 'Eid', match: (p) => /eid/i.test(p.title || '') },
  { label: 'Quran', match: (p) => /quran/i.test(p.title || '') },
];

// ---------- Category chips (URL ?cat= sync ke liye) ----------
export const CATEGORY_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'umrah', label: 'Umrah Badal' },
  { id: 'hajj', label: 'Hajj Badal' },
  { id: 'donation', label: 'Donations' },
];

export function filterByCategory(packages, cat) {
  if (!cat || cat === 'all') return packages;
  return packages.filter((p) => categoryOf(p) === cat);
}

// ---------- ROW BUILDER — page ka core ----------
export function buildRows(allPackages, savedIds = []) {
  const packages = Array.isArray(allPackages) ? allPackages : [];
  const byTitle = new Map(packages.map((p) => [String(p.title || '').trim(), p]));
  const pickTitles = (titles) => titles.map((t) => byTitle.get(t)).filter(Boolean);
  const byPrice = (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0);

  // Portion 1: Umrah Badal slider — Economy -> VIP (price ladder)
  const umrah = packages.filter((p) => categoryOf(p) === 'umrah').sort(byPrice);

  // Portion 2: Hajj Badal slider — Economy -> VIP
  const hajj = packages.filter((p) => categoryOf(p) === 'hajj').sort(byPrice);

  // Portion 3: Donations -> 5 themed sliders (fixed intentional order)
  const donationRows = Object.keys(DONATION_SUBCATEGORY)
    .map((group) => ({
      id: group,
      title: group,
      items: pickTitles(DONATION_SUBCATEGORY[group]),
    }))
    .filter((r) => r.items.length > 0);

  // Under PKR 5,000 (donations only, sasta se mehnga)
  const under5k = packages
    .filter((p) => categoryOf(p) === 'donation' && (Number(p.price) || 0) <= 5000)
    .sort(byPrice);

  // My List (localStorage hearts) — sirf tab row banti hai jab kuch saved ho
  const saved = packages.filter((p) => savedIds.includes(String(p._id)));
  const popular = pickTitles(POPULAR_TITLES);

  // Row order (blueprint): Saved -> Popular -> Umrah -> Hajj -> 5 donation rows -> Under 5K
  const rows = [];
  if (saved.length) rows.push({ id: 'saved', title: 'My List', items: saved });
  rows.push({ id: 'popular', title: 'Popular on IbadahConnect', items: popular, badgeFrom: 1 });
  rows.push({ id: 'umrah', title: 'Umrah Badal', items: umrah });
  rows.push({ id: 'hajj', title: 'Hajj Badal', items: hajj });
  rows.push(...donationRows);
  if (under5k.length) rows.push({ id: 'under5k', title: 'Under PKR 5,000', items: under5k });

  // khali row screen par kabhi nahi dikhegi
  return rows.filter((r) => r.items.length > 0);
}

// ---------- Search helpers (300ms debounce page file me hoga) ----------
export function searchPackages(packages, q) {
  const term = String(q || '').trim().toLowerCase();
  if (!term) return [];
  return packages.filter((p) => {
    const hay = [p.title, p.desc, p.category, subCategoryOf(p)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(term);
  });
}

// No-results screen: "Try one of these" suggestions
export function suggestTitles(packages) {
  const out = [];
  HOT_CHIPS.forEach((chip) => {
    const hit = packages.find((p) => chip.match(p));
    if (hit) out.push(hit.title);
  });
  return out.slice(0, 4);
}

// ---------- Seasonal spotlight (hero area) ----------
export function spotlightPick(packages) {
  const byTitle = new Map(packages.map((p) => [String(p.title || '').trim(), p]));
  const seasonPriority = [
    'Umrah for a Poor Pilgrim',
    'Orphan Sponsorship',
    'Water Coolers',
    'Sadaqah Jariya Bundle',
  ];
  for (const t of seasonPriority) {
    if (byTitle.has(t)) return byTitle.get(t);
  }
  return packages.find((p) => categoryOf(p) === 'donation') || packages[0] || null;
}

export function seasonLabel() {
  const m = new Date().getMonth(); // 0-11
  if (m >= 4 && m <= 6) return 'Hajj Season';
  if (m >= 1 && m <= 3) return 'Blessed Spring';
  if (m >= 9 && m <= 11) return 'Winter of Barakah';
  return 'Season of Sadaqah';
}
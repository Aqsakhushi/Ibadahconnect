// ============================================================================
// src/pages/TrackOrder.jsx  —  v3.8 (Sponsor Live Tracking + Locate Button)
// ----------------------------------------------------------------------------
// CHANGE (v3.8): Legend chips replaced with a "Locate Performer Live" button.
//   - One click -> the map flies to the performer's live green marker
//     (zoom 16) and opens its popup — same experience as the performer
//     portal's locate. If live GPS has not arrived yet, the button flies to
//     the gold proof pin instead. Button stays disabled until any GPS exists.
//
// CHANGE (v3.7): LIVE PERSON TRACKING on the sponsor map.
//   - The map polls GET /api/live/:orderId every 10 seconds and shows the
//     performer as a GREEN PERSON MARKER with an accuracy circle — the map
//     follows them automatically.
//   - The GOLD PIN still shows the latest proof GPS.
//   - Status chip: LIVE / LAST SEEN x MIN AGO / WAITING FOR PERFORMER GPS.
//
// CHANGE (v3.6): Live Location map is UNLOCKED for ALL orders. The payment
//   gate is removed — the sponsor sees the performer's latest GPS pin the
//   moment any proof (photo / video / message) is submitted.
//
// Proof pipeline: reads ORDER-LEVEL fields written by PerformerDashboard —
//   proofUrl, proofLocation ({lat,lng,address} | "lat, lng" | text),
//   proofSubmittedAt, stepsDone, currentStep, progress, taskCompleted.
//
// Message-type steps (Niyyah / Miqat Talbiyah): the performer's typed message
//   travels inside proofLocation.address and is shown here as a
//   "Message from performer" card so the sponsor reads the exact words.
//
// NOTE: this page renders the tracking body only — your global Navbar/Layout
//   (rendered in App.jsx) stays untouched.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaBoxOpen, FaCertificate, FaCheck, FaClipboardCheck, FaClock, FaCrosshairs,
  FaEnvelope, FaHourglassHalf, FaImage, FaLock, FaMapMarkedAlt, FaMapMarkerAlt,
  FaMoneyBillWave, FaMosque, FaPhoneAlt, FaSearchLocation, FaSpinner,
  FaUserCheck, FaVideo, FaWhatsapp,
} from 'react-icons/fa';

const GREEN = '#1B5E20';
const GREEN_DARK = '#0F3D14';
const GOLD = '#D4AF37';
const API = 'http://localhost:5000';
const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

// Per-package step totals — must match PerformerDashboard blueprints.
const STEP_TITLES = {
  donation: [
    'Niyyah (Intention)',
    'Procurement (Buy the Items)',
    'Distribution (Handover with GPS Video)',
    'Report + Dua',
  ],
  umrah: [
    'Preparation & Ihram',
    'Miqat — Niyyah & Talbiyah',
    'Safar Towards the Haram',
    'Entering Masjid al-Haram',
    'Tawaf — 7 Circuits',
    "2 Rak'ahs at Maqam Ibrahim",
    'Drinking Zamzam',
    "Sa'i — 7 Laps (Safa to Marwah)",
    'Halq / Taqsir',
    'Final Dua for the Beneficiary',
  ],
  hajj: [
    'Ihram & Niyyah at Miqat',
    'Talbiyah in Safar',
    'Tawaf al-Qudum (Arrival)',
    "Sa'i",
    'Stay in Mina',
    'Arafah — Wuquf',
    'Night at Muzdalifah',
    'Rami & Tawaf al-Ziyarah',
    'Halq / Taqsir',
    'Farewell Tawaf (Wada)',
  ],
};

const KIND_LABEL = {
  donation: 'Sadaqah / Donation',
  umrah: 'Umrah Badal',
  hajj: 'Hajj Badal',
};

const CENTERS = {
  umrah: { lat: 21.4225, lng: 39.8262 },    // Masjid al-Haram, Makkah
  hajj: { lat: 21.4225, lng: 39.8262 },
  donation: { lat: 31.5204, lng: 74.3587 }, // Lahore
};

// ------------------------------- helpers -----------------------------------

function pickStr(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fixAssetUrl(u) {
  const s = pickStr(u).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  if (s.startsWith('/uploads')) return API + s;
  return s;
}

function parseProofLocation(v) {
  if (!v) return { lat: null, lng: null, address: '' };
  if (typeof v === 'object') {
    if (Array.isArray(v)) return { lat: null, lng: null, address: v.join(', ') };
    const lat = num(v.lat);
    const lng = num(v.lng ?? v.lon ?? v.longitude);
    const address = pickStr(v.address ?? v.addr ?? v.text ?? '').trim();
    return { lat, lng, address };
  }
  const s = pickStr(v).trim();
  const m = s.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng, address: '' };
  }
  return { lat: null, lng: null, address: s };
}

function fmtDate(ts) {
  const d = ts ? new Date(ts) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
}

function fmtTime(ts) {
  const d = ts ? new Date(ts) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
}

function detectKind(o) {
  const t = `${pickStr(o && o.category)} ${pickStr(o && o.name)} ${pickStr(o && o.packageName)}`.toLowerCase();
  if (t.includes('hajj')) return 'hajj';
  if (t.includes('umrah')) return 'umrah';
  return 'donation';
}

function matchesCode(o, code) {
  if (!o || !code) return false;
  const c = pickStr(code).trim().toLowerCase();
  return [o.trackingCode, o.orderCode, o.code, o.tracking_code, o._id, o.id]
    .some((v) => v != null && pickStr(v).trim().toLowerCase() === c);
}

function extractOrder(data, code) {
  if (!data) return null;
  const lists = [];
  const root = data.order || data.data || data.result || data;
  if (Array.isArray(root)) lists.push(root);
  if (Array.isArray(data.orders)) lists.push(data.orders);
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    if (matchesCode(root, code)) return root;
    if (Array.isArray(root.orders)) lists.push(root.orders);
    if (Array.isArray(root.items)) lists.push(root.items);
  }
  for (const list of lists) {
    const hit = list.find((o) => matchesCode(o, code));
    if (hit) return hit;
  }
  return null;
}

async function fetchOrderByCode(code) {
  const q = encodeURIComponent(pickStr(code).trim());
  const urls = [
    `/api/orders/track/${q}`,
    `/api/orders/tracking/${q}`,
    `/api/orders/code/${q}`,
    `/api/orders?code=${q}`,
    `/api/orders/${q}`,
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u);
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      const order = extractOrder(data, code);
      if (order) return order;
    } catch (e) {
      // try next endpoint
    }
  }
  return null;
}

// Live person position — performer portal pushes GPS to the server, this page
// polls it. Endpoint chain covers the upcoming server.js delivery.
async function fetchLiveLocation(orderKey) {
  const q = encodeURIComponent(pickStr(orderKey).trim());
  if (!q) return null;
  const urls = [
    `/api/live/${q}`,
    `/api/live-location/${q}`,
    `/api/orders/${q}/live`,
    `/api/track/live/${q}`,
  ];
  for (const u of urls) {
    try {
      const res = await fetch(u);
      if (!res.ok) continue;
      const data = await res.json().catch(() => null);
      if (!data) continue;
      const d = data.live || data.location || data.data || data;
      const lat = num(d.lat ?? d.latitude);
      const lng = num(d.lng ?? d.lon ?? d.longitude);
      if (lat == null || lng == null) continue;
      return {
        lat,
        lng,
        accuracy: num(d.accuracy) || 0,
        updatedAt: d.updatedAt || d.at || d.time || new Date().toISOString(),
        performerName: pickStr(d.performerName || d.name),
      };
    } catch (e) {
      // try next endpoint
    }
  }
  return null;
}

function normalizeOrder(raw) {
  const o = raw || {};
  const kind = detectKind(o);
  const code = pickStr(o.trackingCode || o.orderCode || o.code || o.tracking_code || o._id).trim();
  const createdAt = o.createdAt || o.orderDate || o.date || null;

  const itemsRaw = Array.isArray(o.items) ? o.items : Array.isArray(o.packages) ? o.packages : [];
  let packageLine = '';
  if (itemsRaw.length) {
    packageLine = itemsRaw
      .map((it) => {
        const nm = pickStr(it && (it.name || it.title || it.package)).trim() || 'Package';
        const q = num(it && (it.qty || it.quantity)) || 1;
        return q > 1 ? `${nm} x${q}` : nm;
      })
      .join(', ');
  }
  if (!packageLine) {
    const nm = pickStr(o.name || o.packageName || o.title).trim();
    const q = num(o.quantity || o.qty) || 1;
    packageLine = nm ? (q > 1 ? `${nm} x${q}` : nm) : 'Your Ibadah Order';
  }

  const paymentRaw = pickStr(o.paymentStatus || o.payment_status || o.payment).toLowerCase();
  const paid =
    (/paid/.test(paymentRaw) && !/unpaid/.test(paymentRaw)) ||
    paymentRaw === 'completed' ||
    paymentRaw === 'success';

  const amount = num(o.totalAmount ?? o.amount ?? o.grandTotal ?? o.price ?? o.total);
  const status = pickStr(o.status || o.orderStatus).trim();
  const performerName = pickStr(
    o.performerName || (o.performer && (o.performer.name || o.performer.performerName)) || ''
  ).trim();
  const performerCity = pickStr(o.performerCity || (o.performer && o.performer.city)).trim();

  const loc = parseProofLocation(o.proofLocation);

  let stepsDoneRaw = 0;
  const cand = [o.progress && o.progress.stepsDone, o.stepsDone, o.milestonesDone];
  for (const v of cand) {
    const n2 = num(v);
    if (n2 != null && n2 >= 0) {
      stepsDoneRaw = Math.floor(n2);
      break;
    }
  }
  const totalSteps = STEP_TITLES[kind].length;
  const done = Math.min(stepsDoneRaw, totalSteps);

  const proofItems = [];
  const pushProof = (p) => {
    if (p && p.url && !proofItems.some((x) => x.url === p.url)) proofItems.push(p);
  };
  if (Array.isArray(o.proofs)) {
    o.proofs.forEach((p) => {
      const u = fixAssetUrl(pickStr(p && (p.url || p.proofUrl || p.image || p.photo)));
      if (!u) return;
      pushProof({
        url: u,
        type: VIDEO_RE.test(u) ? 'video' : 'image',
        time: (p && (p.submittedAt || p.createdAt || p.time)) || '',
        loc: parseProofLocation(p && (p.location || p.proofLocation)),
        note: pickStr(p && (p.note || p.proofNote)),
      });
    });
  }
  const mainUrl = fixAssetUrl(pickStr(o.proofUrl));
  if (mainUrl) {
    pushProof({
      url: mainUrl,
      type: VIDEO_RE.test(mainUrl) ? 'video' : 'image',
      time: o.proofSubmittedAt || '',
      loc,
      note: pickStr(o.proofNote || o.proofNotes),
    });
  }

  return {
    raw: o, kind, code, createdAt, packageLine, paid, amount, status,
    performerName, performerCity, loc, totalSteps, done, proofItems, mainUrl,
  };
}

// ------------------------------ leaflet CDN --------------------------------

let leafletPromise = null;
function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve(window.L || null);
      script.onerror = () => reject(new Error('leaflet failed to load'));
      document.body.appendChild(script);
    });
  }
  return leafletPromise;
}

function pinIcon(L, color) {
  const svg = `<svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg"><path d="M17 0C7.6 0 0 7.6 0 17c0 12.2 14.5 26.9 15.9 28.3a1.6 1.6 0 0 0 2.2 0C19.5 43.9 34 29.2 34 17 34 7.6 26.4 0 17 0z" fill="${color}"/><circle cx="17" cy="17" r="7" fill="#ffffff"/></svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [34, 46], iconAnchor: [17, 46], popupAnchor: [0, -44] });
}

// Green person marker — represents the performer themselves on the map.
function personIcon(L) {
  const svg = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" fill="#1B5E20" stroke="#ffffff" stroke-width="3"/><circle cx="20" cy="14" r="5" fill="#ffffff"/><path d="M20 21c-5 0-8 3-8 7v3h16v-3c0-4-3-7-8-7z" fill="#ffffff"/></svg>`;
  return L.divIcon({ html: svg, className: 'ic-person-pin', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22] });
}

// ------------------------------- styles ------------------------------------

const CARD = {
  background: '#ffffff', border: '1px solid #e3e9e3', borderRadius: 16,
  padding: 20, boxShadow: '0 6px 18px rgba(15, 61, 20, 0.06)', marginBottom: 18,
};
const H2 = {
  display: 'flex', alignItems: 'center', gap: 10, fontSize: 20,
  fontWeight: 700, color: GREEN_DARK, margin: '0 0 4px',
};
const SUB = { margin: '0 0 14px', color: '#5b6b5d', fontSize: 14 };
const chipStyle = (bg, fg) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, background: bg,
  color: fg, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700,
});

const PAGE_CSS = `
.ic-map { height: 360px; }
.ic-map .leaflet-container { height: 100%; width: 100%; font-family: 'Outfit', sans-serif; }
@media (max-width: 640px) { .ic-map { height: 260px; } }
.ic-pulse { animation: icPulse 1.5s ease-in-out infinite; }
@keyframes icPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.ic-person-pin svg { animation: icPulse 1.6s ease-in-out infinite; }
`;

// ------------------------------ components ---------------------------------

function MediaBlock({ url, type, height }) {
  if (!url) return null;
  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        style={{ width: '100%', height: height || 240, objectFit: 'cover', borderRadius: 12, background: '#000', display: 'block' }}
      />
    );
  }
  return (
    <img
      src={url}
      alt="Proof from performer"
      style={{ width: '100%', height: height || 240, objectFit: 'cover', borderRadius: 12, background: '#eef3ee', display: 'block' }}
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function SponsorMap({ coords, live, kind, performerName, focusTick }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const proofMarkerRef = useRef(null);
  const personMarkerRef = useRef(null);
  const accCircleRef = useRef(null);
  const stateRef = useRef({ coords, live });
  stateRef.current = { coords, live };

  useEffect(() => {
    let dead = false;
    loadLeaflet()
      .then((L) => {
        if (dead || !boxRef.current || mapRef.current || !L) return;
        const s = stateRef.current;
        const first = (s.live && { lat: s.live.lat, lng: s.live.lng }) || s.coords || CENTERS[kind] || CENTERS.donation;
        const zoom = (s.live || s.coords) ? 15 : 11;
        const map = L.map(boxRef.current, { scrollWheelZoom: true }).setView([first.lat, first.lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapRef.current = map;

        if (s.coords) {
          proofMarkerRef.current = L.marker([s.coords.lat, s.coords.lng], { icon: pinIcon(L, GOLD) })
            .addTo(map)
            .bindPopup('Latest proof GPS');
        }
        if (s.live) {
          const label = `${s.live.performerName || performerName || 'Performer'} - live position`;
          personMarkerRef.current = L.marker([s.live.lat, s.live.lng], { icon: personIcon(L), zIndexOffset: 500 })
            .addTo(map)
            .bindPopup(label);
          accCircleRef.current = L.circle([s.live.lat, s.live.lng], {
            radius: s.live.accuracy || 60, color: '#1B5E20', weight: 1,
            fillColor: '#1B5E20', fillOpacity: 0.12,
          }).addTo(map);
          map.setView([s.live.lat, s.live.lng], 15);
        }
      })
      .catch(() => {});
    return () => {
      dead = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (e) { /* noop */ }
        mapRef.current = null;
        proofMarkerRef.current = null;
        personMarkerRef.current = null;
        accCircleRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Locate Performer Live — button click flies to the green marker (or gold pin)
  useEffect(() => {
    if (!focusTick) return;
    const map = mapRef.current;
    if (!map) return;
    const s = stateRef.current;
    if (s.live) {
      map.flyTo([s.live.lat, s.live.lng], 16, { duration: 0.8 });
      if (personMarkerRef.current) personMarkerRef.current.openPopup();
    } else if (s.coords) {
      map.flyTo([s.coords.lat, s.coords.lng], 15, { duration: 0.8 });
      if (proofMarkerRef.current) proofMarkerRef.current.openPopup();
    }
  }, [focusTick]);

  // Gold proof pin updates
  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !coords) return;
    if (!proofMarkerRef.current) {
      proofMarkerRef.current = L.marker([coords.lat, coords.lng], { icon: pinIcon(L, GOLD) })
        .addTo(map)
        .bindPopup('Latest proof GPS');
    } else {
      proofMarkerRef.current.setLatLng([coords.lat, coords.lng]);
    }
  }, [coords && coords.lat, coords && coords.lng]);

  // Green live person marker updates — map follows the performer
  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !live) return;
    const label = `${live.performerName || performerName || 'Performer'} - live position`;
    if (!personMarkerRef.current) {
      personMarkerRef.current = L.marker([live.lat, live.lng], { icon: personIcon(L), zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(label);
      accCircleRef.current = L.circle([live.lat, live.lng], {
        radius: live.accuracy || 60, color: '#1B5E20', weight: 1,
        fillColor: '#1B5E20', fillOpacity: 0.12,
      }).addTo(map);
      map.setView([live.lat, live.lng], 15);
    } else {
      personMarkerRef.current.setLatLng([live.lat, live.lng]);
      personMarkerRef.current.bindPopup(label);
      if (accCircleRef.current) {
        accCircleRef.current.setLatLng([live.lat, live.lng]);
        accCircleRef.current.setRadius(live.accuracy || 60);
      }
      map.panTo([live.lat, live.lng]);
    }
  }, [live && live.lat, live && live.lng, live && live.updatedAt]);

  return (
    <div
      className="ic-map"
      ref={boxRef}
      style={{ width: '100%', borderRadius: 14, overflow: 'hidden', background: '#e7efe7', border: '1px solid #dbe5db' }}
    />
  );
}

function OrderCard({ n }) {
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: GREEN_DARK }}>{n.code || 'Order'}</span>
            <span style={chipStyle('#e7f0e7', GREEN)}>{KIND_LABEL[n.kind]}</span>
            {n.status ? <span style={chipStyle('#eef1ee', '#415043')}>{n.status}</span> : null}
          </div>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600, color: '#253527', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaBoxOpen style={{ color: GOLD }} /> {n.packageLine}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#5b6b5d' }}>{fmtDate(n.createdAt)}</div>
          {n.performerName ? (
            <div style={{ marginTop: 8, fontSize: 13, color: '#415043', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f2f7f2', border: '1px solid #dfe8df', borderRadius: 999, padding: '4px 12px' }}>
              <FaUserCheck style={{ color: GREEN }} />
              Performer: {n.performerName}{n.performerCity ? ` - ${n.performerCity}` : ''}
            </div>
          ) : null}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={chipStyle(n.paid ? '#e7f0e7' : '#fdecea', n.paid ? GREEN : '#b3261e')}>
            Payment: {n.paid ? 'Paid' : 'Unpaid'}
          </span>
          <div style={{ fontSize: 12, color: n.paid ? GREEN : '#b3261e', fontWeight: 600, marginTop: 6 }}>
            {n.paid ? 'Payment Received' : 'Awaiting Payment'}
          </div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: GREEN_DARK, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
            <FaMoneyBillWave style={{ color: GOLD }} />
            {n.amount != null ? `PKR ${n.amount.toLocaleString('en-US')}` : 'PKR —'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressCard({ n }) {
  const percent = Math.round((n.done / n.totalSteps) * 100);
  const nextTitle = n.done < n.totalSteps ? STEP_TITLES[n.kind][n.done] : '';
  return (
    <div style={CARD}>
      <h2 style={H2}>Progress</h2>
      <p style={SUB}>Steps open one by one in the correct sharai order — each step arrives here with its proof.</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, color: GREEN_DARK }}>
        <span>{n.done} of {n.totalSteps} steps completed</span>
        <span style={{ color: GOLD }}>{percent}%</span>
      </div>
      <div style={{ height: 10, background: '#edf2ed', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: `linear-gradient(90deg, ${GREEN}, ${GOLD})`, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 14, color: '#415043' }}>
        {n.done > 0
          ? `Step ${n.done} is confirmed. Waiting for the performer to complete the next step - new proofs appear here automatically.`
          : 'The performer has not completed a step yet - new proofs appear here automatically.'}
      </p>
      {nextTitle ? (
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fbf6e7', border: `1px solid ${GOLD}`, color: '#7a5c00', fontWeight: 700, fontSize: 13, borderRadius: 999, padding: '5px 14px' }}>
          Next up: {nextTitle}
        </div>
      ) : (
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e7f0e7', color: GREEN, fontWeight: 700, fontSize: 13, borderRadius: 999, padding: '5px 14px' }}>
          All steps complete - certificate on the way
        </div>
      )}
    </div>
  );
}

function LatestUpdateCard({ n }) {
  const { mainUrl, loc } = n;
  const hasCoords = Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
  const hasAny = mainUrl || loc.address || hasCoords || n.raw.proofSubmittedAt;
  if (!hasAny) return null;
  const updated = fmtTime(n.raw.proofSubmittedAt);
  return (
    <div style={{ ...CARD, border: `2px solid ${GOLD}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ ...H2, margin: 0 }}><FaClipboardCheck style={{ color: GOLD }} /> Latest Update from Performer</h2>
        {updated ? (
          <span style={{ fontSize: 12, color: '#5b6b5d', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FaClock /> Updated {updated}
          </span>
        ) : null}
      </div>

      {mainUrl ? (
        <div style={{ marginTop: 12 }}>
          <MediaBlock url={mainUrl} type={VIDEO_RE.test(mainUrl) ? 'video' : 'image'} />
        </div>
      ) : null}

      {loc.address ? (
        <div style={{ marginTop: 12, background: '#f4f8f4', borderLeft: `4px solid ${GREEN}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: GREEN, marginBottom: 6 }}>
            MESSAGE FROM PERFORMER
          </div>
          <div style={{ fontSize: 15, color: '#22301f', fontStyle: 'italic', lineHeight: 1.6 }}>
            &ldquo;{loc.address}&rdquo;
          </div>
        </div>
      ) : null}

      {hasCoords ? (
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e7f0e7', color: GREEN, borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>
          <FaMapMarkerAlt /> GPS: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
        </div>
      ) : null}

      {pickStr(n.raw.proofNote || n.raw.proofNotes) ? (
        <div style={{ marginTop: 10, fontSize: 13, color: '#415043' }}>
          Note: {pickStr(n.raw.proofNote || n.raw.proofNotes)}
        </div>
      ) : null}
    </div>
  );
}

function ProofGallery({ n }) {
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ ...H2, margin: 0 }}>Proof &amp; Location</h2>
        <span style={chipStyle('#eef1ee', '#415043')}>{n.proofItems.length} items</span>
      </div>
      <p style={{ ...SUB, marginTop: 6 }}>Everything the performer shares lands here automatically.</p>
      {n.proofItems.length === 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#8a988c', fontSize: 14, fontWeight: 600 }}>
            <FaImage /> No step-wise proof yet
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#8a988c' }}>
            Per-step photos will collect here as the performer completes each stage. The newest proof is shown in the Latest Update card above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {n.proofItems.map((p, i) => (
            <div key={`${p.url}-${i}`} style={{ border: '1px solid #e3e9e3', borderRadius: 12, overflow: 'hidden', background: '#fbfdfb' }}>
              <MediaBlock url={p.url} type={p.type} height={150} />
              <div style={{ padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: GREEN_DARK }}>
                  Proof {i + 1}{p.time ? ` - ${fmtTime(p.time)}` : ''}
                </div>
                {p.note ? <div style={{ fontSize: 12, color: '#5b6b5d', marginTop: 4 }}>{p.note}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveLocationCard({ n, live }) {
  const [focusTick, setFocusTick] = useState(0);
  const hasCoords = Number.isFinite(n.loc.lat) && Number.isFinite(n.loc.lng);
  const coords = hasCoords ? { lat: n.loc.lat, lng: n.loc.lng } : null;
  const canLocate = !!(live || coords);

  let ageSec = null;
  if (live && live.updatedAt) {
    const a = (Date.now() - new Date(live.updatedAt).getTime()) / 1000;
    if (Number.isFinite(a)) ageSec = a;
  }
  const liveFresh = ageSec != null && ageSec < 120;
  const seenText = ageSec == null ? '' : (ageSec < 60 ? '<1 MIN AGO' : `${Math.floor(ageSec / 60)} MIN AGO`);

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ ...H2, margin: 0 }}><FaMapMarkedAlt style={{ color: GOLD }} /> Live Location</h2>
        {liveFresh ? (
          <span style={chipStyle('#e7f0e7', GREEN)}>
            <span className="ic-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: GREEN, display: 'inline-block' }} />
            LIVE - PERFORMER TRACKING
          </span>
        ) : live ? (
          <span style={chipStyle('#fbf6e7', '#8a6d00')}><FaClock /> LAST SEEN {seenText}</span>
        ) : coords ? (
          <span style={chipStyle('#eef1ee', '#415043')}>PROOF GPS ON MAP</span>
        ) : (
          <span style={chipStyle('#fbf6e7', '#8a6d00')}>WAITING FOR PERFORMER GPS</span>
        )}
      </div>
      <p style={{ ...SUB, marginTop: 6 }}>
        The map points out the performer in real time - no payment required.
      </p>
      <SponsorMap coords={coords} live={live} kind={n.kind} performerName={n.performerName} focusTick={focusTick} />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <button
          onClick={() => setFocusTick((t) => t + 1)}
          disabled={!canLocate}
          style={{
            background: canLocate ? GREEN : '#9fb8a0',
            color: '#ffffff',
            border: 'none',
            borderRadius: 999,
            padding: '12px 28px',
            fontWeight: 800,
            fontSize: 14,
            cursor: canLocate ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: canLocate ? '0 6px 16px rgba(15, 61, 20, 0.25)' : 'none',
            opacity: canLocate ? 1 : 0.6,
          }}
        >
          <FaCrosshairs style={{ fontSize: 16 }} /> Locate Performer Live
        </button>
      </div>
      {!canLocate ? (
        <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 12, color: '#8a988c' }}>
          The button activates as soon as the performer&apos;s GPS arrives.
        </p>
      ) : null}

      {liveFresh ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#415043' }}>
          {live.performerName || n.performerName || 'The performer'}&apos;s live position updates here every 10 seconds automatically
          {live.accuracy ? ` (accuracy ~${Math.round(live.accuracy)}m)` : ''}. Press Locate Performer Live to jump straight to them.
        </p>
      ) : live ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#415043' }}>
          The performer&apos;s device last reported {seenText.toLowerCase()} - tracking resumes the moment their portal is open again.
        </p>
      ) : coords ? (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#415043' }}>
          Gold pin shows the latest proof GPS for now. The green live marker appears as soon as the performer&apos;s portal is open.
        </p>
      ) : (
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#415043' }}>
          Map is live and tracking-ready. The performer&apos;s green marker appears here the moment their portal is open with
          location sharing - the gold pin drops with the first proof.
        </p>
      )}
    </div>
  );
}

function TimelineCard({ n }) {
  const stages = [
    {
      title: 'Order Confirmed',
      desc: 'Your email is verified and the order is accepted.',
      meta: fmtDate(n.createdAt),
      done: true,
    },
    {
      title: 'Performer Assigned',
      desc: n.performerName
        ? `${n.performerName}${n.performerCity ? ` - ${n.performerCity}` : ''} is assigned to your order.`
        : 'A verified performer has been assigned to your order.',
      meta: '',
      done: !!n.performerName || /assign/i.test(n.status),
    },
    {
      title: 'Ritual In Progress',
      desc: 'The performer is carrying out the ibadah on your behalf.',
      meta: n.done > 0 ? `${n.done} of ${n.totalSteps} steps done` : '',
      done: n.done > 0,
    },
    {
      title: 'Proof & Verification',
      desc: 'Photo/GPS proof is captured near the holy site.',
      meta: n.proofItems.length ? `${n.proofItems.length} proof item${n.proofItems.length > 1 ? 's' : ''} received` : '',
      done: n.proofItems.length > 0 || !!n.loc.address,
    },
    {
      title: 'Completed',
      desc: 'Ibadah complete - certificate is available.',
      meta: '',
      done: !!n.raw.taskCompleted || /complete/i.test(n.status),
    },
  ];
  return (
    <div style={CARD}>
      <h2 style={H2}>Step Timeline</h2>
      <p style={SUB}>From order confirmation to the official certificate.</p>
      <div>
        {stages.map((s, i) => (
          <div key={s.title} style={{ display: 'flex', gap: 14, padding: '10px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14,
                background: s.done ? GREEN : '#edf2ed',
                color: s.done ? '#ffffff' : '#8a988c',
                border: s.done ? 'none' : '1px solid #dfe8df',
              }}>
                {s.done ? <FaCheck /> : i + 1}
              </div>
              {i < stages.length - 1 ? (
                <div style={{ width: 2, flex: 1, minHeight: 22, background: s.done ? GREEN : '#dfe8df', marginTop: 4 }} />
              ) : null}
            </div>
            <div style={{ paddingBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: s.done ? GREEN_DARK : '#5b6b5d' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#5b6b5d', marginTop: 2 }}>{s.desc}</div>
              {s.meta ? <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginTop: 2 }}>{s.meta}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DuaBlock() {
  return (
    <section style={{ background: GREEN_DARK, padding: '44px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Amiri', serif", fontSize: 30, color: GOLD, marginBottom: 10, lineHeight: 1.8 }}>
        اللَّهُمَّ اغْفِرْ لَهُمْ وَارْحَمْهُمْ
      </div>
      <div style={{ color: '#e8f2e8', fontSize: 15 }}>O Allah, forgive them - and shower Your mercy upon them.</div>
    </section>
  );
}

function CtaBlock() {
  const feature = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(212,175,55,0.4)',
    color: '#f3ecd4', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600,
  };
  return (
    <section style={{ background: 'linear-gradient(135deg, #124a18 0%, #1B5E20 55%, #14421a 100%)', padding: '54px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
          They Prayed for You All Their Life.
          <br />
          <span style={{ color: GOLD }}>Now It&apos;s Your Turn.</span>
        </div>
        <p style={{ color: '#d7e5d7', fontSize: 15, lineHeight: 1.75, margin: '14px auto 20px', maxWidth: 720 }}>
          Honor them with an Umrah performed in their name - inside the sacred walls of Masjid al-Haram,
          by a CNIC-verified scholar, with live video proof of every ritual and an official certificate in your hands.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <span style={feature}><FaMosque style={{ color: GOLD }} /> Inside Masjid al-Haram</span>
          <span style={feature}><FaVideo style={{ color: GOLD }} /> Live Video Proof</span>
          <span style={feature}><FaCertificate style={{ color: GOLD }} /> Official Certificate</span>
          <span style={feature}><FaHourglassHalf style={{ color: GOLD }} /> Completed in 3-4 Days</span>
        </div>
        <Link
          to="/services"
          style={{ display: 'inline-block', marginTop: 22, background: GOLD, color: '#14330f', fontWeight: 800, fontSize: 16, borderRadius: 12, padding: '13px 34px', textDecoration: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}
        >
          Book Umrah Badal
        </Link>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#cfe0cf', fontSize: 13 }}>
          <FaWhatsapp style={{ color: GOLD }} /> WhatsApp - +92 339 0138178
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: '#9fb8a0', fontSize: 12 }}>
          <FaLock style={{ color: GOLD }} /> Your payment is held as Amanah - released only after video-verified completion.
        </div>
      </div>
    </section>
  );
}

function FooterBlock() {
  const linkCol = { fontSize: 14, color: '#cfe0cf', lineHeight: 2, textDecoration: 'none' };
  return (
    <footer style={{ background: GREEN_DARK, color: '#e8f2e8', padding: '44px 16px 28px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, marginBottom: 10 }}>IbadahConnect</div>
          <p style={{ fontSize: 13, color: '#cfe0cf', lineHeight: 1.7, margin: 0 }}>
            IbadahConnect is Pakistan&apos;s trusted platform for Badal Umrah, Badal Hajj and Sadaqah -
            performed by CNIC-verified scholars inside Masjid al-Haram, Makkah, with live proof and an official certificate.
          </p>
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: '#9fb8a0' }}>Secure Payments</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {['Easypaisa', 'JazzCash', 'Bank Transfer', 'Debit / Credit Card'].map((p) => (
              <span key={p} style={{ border: '1px solid #2c5b31', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#cfe0cf' }}>{p}</span>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>Quick Links</div>
          {[['Home', '/'], ['Our Services', '/services'], ['How It Works', '/how-it-works'], ['Reviews', '/reviews'], ['FAQs', '/faqs']].map(([label, to]) => (
            <div key={label}><Link to={to} style={linkCol}>{label}</Link></div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>Our Services</div>
          {['Umrah Badal', 'Hajj Badal', 'Donation & Sadqa', 'Donate in Mecca'].map((label) => (
            <div key={label}><Link to="/services" style={linkCol}>{label}</Link></div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>Get In Touch</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#cfe0cf' }}>
            <FaPhoneAlt style={{ color: GOLD }} /> +92 339 0138178
          </div>
          <a href="https://wa.me/923390138178" style={{ ...linkCol, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaWhatsapp style={{ color: GOLD }} /> WhatsApp - Instant Reply
          </a>
          <a href="mailto:ibadahconnect@gmail.com" style={{ ...linkCol, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaEnvelope style={{ color: GOLD }} /> ibadahconnect@gmail.com
          </a>
        </div>
      </div>
      <div style={{ maxWidth: 1040, margin: '26px auto 0', borderTop: '1px solid #2c5b31', paddingTop: 14, fontSize: 12, color: '#9fb8a0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>IbadahConnect - Badal Umrah, Badal Hajj &amp; Sadaqah with live proof.</span>
        <span>Copyright {new Date().getFullYear()} IbadahConnect. All rights reserved.</span>
      </div>
    </footer>
  );
}

// -------------------------------- main -------------------------------------

export default function TrackOrder() {
  const params = useParams();
  const [code, setCode] = useState(() => pickStr(localStorage.getItem('ic_track_code')).trim());
  const [order, setOrder] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const autoTried = useRef(false);

  const load = useCallback(async (c, silent) => {
    const q = pickStr(c).trim();
    if (!q) {
      if (!silent) setErr('Please enter your tracking code.');
      return;
    }
    if (!silent) {
      setLoading(true);
      setErr('');
    }
    const o = await fetchOrderByCode(q);
    if (!silent) setLoading(false);
    if (o) {
      localStorage.setItem('ic_track_code', q);
      setOrder(o);
    } else if (!silent) {
      setErr('No order found for this code. Check the code and try again.');
    }
  }, []);

  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const fromUrl = pickStr(params.orderId || params.code).trim();
    const saved = pickStr(localStorage.getItem('ic_track_code')).trim();
    const q = fromUrl || saved;
    if (q) {
      setCode(q);
      load(q);
    }
  }, [params, load]);

  // Silent auto-refresh every 60s — new proofs land without a manual reload.
  useEffect(() => {
    const q = pickStr(code).trim();
    if (!q || !order) return undefined;
    const t = setInterval(() => { load(q, true); }, 60000);
    return () => clearInterval(t);
  }, [code, order, load]);

  // LIVE person tracking — poll the performer's pushed GPS every 10s.
  const orderKey = useMemo(() => {
    if (!order) return '';
    return pickStr(order._id || order.id || '').trim() || pickStr(code).trim();
  }, [order, code]);

  useEffect(() => {
    if (!orderKey) return undefined;
    let dead = false;
    const tick = async () => {
      const l = await fetchLiveLocation(orderKey);
      if (!dead && l) setLive(l);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, [orderKey]);

  const n = useMemo(() => (order ? normalizeOrder(order) : null), [order]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f5', fontFamily: "'Outfit', sans-serif", color: '#1c2b1e' }}>
      <style>{PAGE_CSS}</style>

      <section style={{ background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN})`, padding: '44px 16px 40px', textAlign: 'center' }}>
        <h1 style={{ color: '#ffffff', fontSize: 32, fontWeight: 800, margin: 0 }}>Track Your Order</h1>
        <p style={{ color: '#d7e5d7', margin: '8px auto 0', maxWidth: 660, fontSize: 15, lineHeight: 1.6 }}>
          Follow your ibadah step by step - proof photos and the live location map appear here automatically.
        </p>
      </section>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '18px 16px 56px' }}>
        <div style={{ ...CARD, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <FaSearchLocation style={{ color: GREEN, fontSize: 20, flexShrink: 0 }} />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(code); }}
            placeholder="Enter tracking code e.g. IC-2026-780742"
            style={{ flex: 1, minWidth: 220, padding: '12px 14px', borderRadius: 10, border: '1px solid #cfd9cf', fontSize: 15, outline: 'none' }}
          />
          <button
            onClick={() => load(code)}
            disabled={loading}
            style={{ background: GREEN, color: '#ffffff', border: 'none', borderRadius: 10, padding: '12px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <FaSpinner className="ic-pulse" /> : null} Track Order
          </button>
        </div>

        {err ? <div style={{ color: '#b3261e', fontWeight: 600, fontSize: 14, margin: '-8px 0 14px' }}>{err}</div> : null}

        {n ? (
          <>
            <OrderCard n={n} />
            <ProgressCard n={n} />
            <LatestUpdateCard n={n} />
            <ProofGallery n={n} />
            <LiveLocationCard n={n} live={live} />
            <TimelineCard n={n} />
          </>
        ) : !loading && !err ? (
          <div style={{ ...CARD, textAlign: 'center', color: '#5b6b5d', fontSize: 14 }}>
            Enter your tracking code above - your order card, live proofs and the unlocked map load here.
          </div>
        ) : null}
      </div>

      <DuaBlock />
      <CtaBlock />
      <FooterBlock />
    </div>
  );
}
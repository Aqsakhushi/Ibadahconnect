import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = ((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')) + '/api';

const SEND_MS = 5000; // Performer: har 5 sec baad server ko location bhejo
const POLL_MS = 5000; // Sponsor: har 5 sec baad latest location fetch karo

const MAKKAH = { lat: 21.4225, lng: 39.8262 }; // Masjid al-Haram

// localStorage se logged-in user (CheckoutPage wala same pattern)
const getStoredUser = () => {
  for (const key of ['user', 'ibadahUser', 'currentUser']) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && (parsed._id || parsed.id || parsed.email)) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
};

const getToken = () => {
  try {
    return localStorage.getItem('token') || '';
  } catch (e) {
    return '';
  }
};

// Do lat/lng points ke darmiyan straight-line distance (km)
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const T = {
  page: { minHeight: '100vh', background: '#f2f5f3', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" },
  card: { width: '100%', maxWidth: 760, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
  h1: { margin: 0, fontSize: 22, color: '#14532d' },
  sub: { margin: '6px 0 16px', fontSize: 14, color: '#6b7280' },
  chip: { display: 'inline-block', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, marginBottom: 14 },
  badge: { display: 'inline-block', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, marginBottom: 12 },
  badgePerf: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  badgeSpons: { background: '#fefce8', color: '#a16207', border: '1px solid #fde68a' },
  map: { height: 420, width: '100%', borderRadius: 12, border: '1px solid #e5e7eb' },
  btnGreen: { display: 'inline-block', marginTop: 14, padding: '12px 18px', borderRadius: 10, border: 'none', background: '#15803d', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
  btnRed: { display: 'inline-block', marginTop: 14, padding: '12px 18px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' },
  ok: { fontSize: 13, color: '#15803d', marginTop: 12 },
  err: { fontSize: 13, color: '#dc2626', marginTop: 10 },
  muted: { fontSize: 13, color: '#6b7280', marginTop: 12 },
  small: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  link: { color: '#15803d', fontWeight: 600, textDecoration: 'none' },
};

export default function TrackOrderPage() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();

  const user = getStoredUser();
  const roleParam = (searchParams.get('role') || '').toLowerCase();
  // ?role=performer ya ?role=sponsor se force kar sakte hain, warna user ke role se decide
  const isPerformer = roleParam
    ? roleParam === 'performer'
    : !!(user && String(user.role || '').toLowerCase() === 'performer');

  const [sharing, setSharing] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [lastSentAt, setLastSentAt] = useState(null);
  const [sendOk, setSendOk] = useState(true);
  const [loc, setLoc] = useState(null);
  const [fetchErr, setFetchErr] = useState('');

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapDivRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const didFitRef = useRef(false);

  /* ---------- Leaflet map init ---------- */
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current).setView([MAKKAH.lat, MAKKAH.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);
  const showPoint = (lat, lng, label) => {
    const map = mapRef.current;
    if (!map) return;

    // Pulse + smooth movement styles (sirf 1 dafa inject hote hain)
    if (!window.__ibcMapStyle) {
      window.__ibcMapStyle = true;
      const s = document.createElement('style');
      s.innerHTML =
        '@keyframes ibcPulse{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.7);opacity:0}}' +
        '.ibc-marker{transition:transform 1.2s ease-in-out}';
      document.head.appendChild(s);
    }

    const pos = [lat, lng];
    if (!markerRef.current) {
      // inDrive-style person marker: green pin + pulsing halo
      const icon = L.divIcon({
        className: 'ibc-marker',
        html:
          '<div style="position:relative;width:40px;height:40px;">' +
            '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,.4);animation:ibcPulse 1.6s ease-out infinite;"></div>' +
            '<div style="position:absolute;inset:6px;border-radius:50%;background:#15803d;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;">🚶</div>' +
          '</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      markerRef.current = L.marker(pos, { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng(pos);
    }
    if (label) markerRef.current.bindPopup(label);
    map.panTo(pos, { animate: true });
  };

  /* ---------- Performer: GPS watch + send ---------- */
  const sendLocation = async (p) => {
    try {
      const token = getToken();
      const res = await fetch(`${API}/orders/${orderId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          latitude: p.lat,
          longitude: p.lng,
          accuracy: p.accuracy,
          userId: user ? user._id || user.id : undefined,
        }),
      });
      if (res.ok) {
        setSendOk(true);
        setLastSentAt(new Date());
      } else {
        setSendOk(false);
      }
    } catch (e) {
      setSendOk(false); // agli update pe dobara try hoga
    }
  };

  const startSharing = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('This browser does not support location sharing.');
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        showPoint(p.lat, p.lng, 'You (Performer) — live location');
        const now = Date.now();
        if (now - lastSentAtRef.current >= SEND_MS) {
          lastSentAtRef.current = now;
          sendLocation(p);
        }
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : 'Could not get your location. Please try again.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setSharing(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  /* ---------- Sponsor: poll latest location ---------- */
  useEffect(() => {
    if (isPerformer) return;
    let alive = true;
    const tick = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API}/orders/${orderId}/location`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok && data && data.location && typeof data.location.latitude === 'number') {
          setLoc(data.location);
          setFetchErr('');
        } else {
          setFetchErr((data && data.message) || 'Location not available yet.');
        }
      } catch (e) {
        if (alive) setFetchErr('Could not fetch location from server.');
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isPerformer, orderId]);

  useEffect(() => {
    if (loc && typeof loc.latitude === 'number') {
      showPoint(
        loc.latitude,
        loc.longitude,
        `Muaddi — ${new Date(loc.updatedAt || Date.now()).toLocaleTimeString()}`
      );
      if (!didFitRef.current) {
        didFitRef.current = true;
        const map = mapRef.current;
        if (map) map.setView([loc.latitude, loc.longitude], 15);
      }
    }
  }, [loc]);

  /* ---------- Login gate ---------- */
  if (!user) {
    return (
      <div style={T.page}>
        <div style={{ ...T.card, maxWidth: 420 }}>
          <h1 style={T.h1}>Login Required</h1>
          <p style={T.sub}>
            Please login to view or share live tracking for this order.
          </p>
          <Link to={`/login?redirect=/track/${orderId}`} style={T.btnGreen}>
            Login
          </Link>
          <p style={T.small}>
            <Link to="/" style={T.link}>Back to home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={T.page}>
      <div style={T.card}>
        <h1 style={T.h1}>Live Tracking</h1>
        <p style={T.sub}>Follow the rites as they are performed, in real time.</p>

        <div>
          <span style={T.chip}>Order: {orderId}</span>{' '}
          <span style={isPerformer ? { ...T.badge, ...T.badgePerf } : { ...T.badge, ...T.badgeSpons }}>
            {isPerformer ? 'Performer — sharing your location' : 'Sponsor — watching performer'}
          </span>
        </div>

        <div ref={mapDivRef} style={T.map} />

        {isPerformer ? (
          <div>
            {!sharing ? (
              <button style={T.btnGreen} onClick={startSharing}>
                Start Sharing Live Location
              </button>
            ) : (
              <button style={T.btnRed} onClick={stopSharing}>
                Stop Sharing
              </button>
            )}
            {sharing && (
              <p style={T.ok}>
                Live sharing is on — your location updates every {SEND_MS / 1000} seconds.
                {lastSentAt
                  ? sendOk
                    ? ` Last sent at ${lastSentAt.toLocaleTimeString()}.`
                    : ' Could not reach server — retrying…'
                  : ''}
              </p>
            )}
            {geoError && <p style={T.err}>{geoError}</p>}
          </div>
        ) : (
          <div>
            {loc ? (
              <>
                <p style={T.ok}>
                  Last location: {new Date(loc.updatedAt || Date.now()).toLocaleTimeString()} —
                  refreshes every {POLL_MS / 1000} seconds.
                </p>
                <p style={T.small}>
                  Distance from Masjid al-Haram (Makkah): ~
                  {haversineKm(loc.latitude, loc.longitude, MAKKAH.lat, MAKKAH.lng).toFixed(1)} km
                </p>
              </>
            ) : (
              <p style={T.muted}>{fetchErr || 'Waiting for performer location…'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
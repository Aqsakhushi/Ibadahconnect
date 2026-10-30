// ============================================================
// IbadahConnect — src/components/netflix/PackageCard.jsx
// NETFLIX FRONTEND — FILE 2 of 4 (card component)
//
// Blueprint rules implemented here:
//   - 16:9 card, same size har row me, object-fit: cover
//   - Hover: scale 1.0 -> 1.05 + shadow + description + View Details
//   - Title max 2 lines, desc max 2 lines (hover par)
//   - Gold price "PKR x,xxx" (toLocaleString via formatPKR)
//   - Popular row: pehle 5 cards par big number badge (rank 1..5)
//   - Heart = My List (localStorage, sab cards sync)
//   - Add to Cart: parent handler ya localStorage fallback + event
//   - loading="lazy" images, no autoplay, no emoji (react-icons)
//
// CSS yahan se ek dafa inject hota hai (id se guard — duplicate nahi).
// Exports: PackageCard (default), readMyList, toggleMyList,
//          readCart, addToCartStorage (page/App reuse ke liye).
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { FiEye, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { formatPKR } from '../../data/rowsConfig';

// ---------- storage keys + events ----------
const MYLIST_KEY = 'ibadahconnect_mylist';
const CART_KEY = 'ibadahconnect_cart';
export const MYLIST_EVENT = 'ibadahconnect:mylist-changed';
export const CART_EVENT = 'ibadahconnect:cart-changed';

function safeParse(raw) {
  try {
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function readMyList() {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(MYLIST_KEY));
}

export function toggleMyList(id) {
  try {
    const sid = String(id);
    const list = readMyList();
    const idx = list.indexOf(sid);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(sid);
    localStorage.setItem(MYLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(MYLIST_EVENT));
    return idx < 0; // true = ab saved hai
  } catch (e) {
    return false;
  }
}

export function readCart() {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(CART_KEY));
}

// Fallback cart: {id,title,price,image} dedup by id. Agar project me
// CartContext hai to App.jsx wiring use override kar degi (File 5).
export function addToCartStorage(pkg) {
  try {
    const pid = String(pkg._id || pkg.id || '');
    const cart = readCart();
    if (pid && !cart.some((c) => String(c.id) === pid)) {
      cart.push({
        id: pid,
        title: pkg.title || '',
        price: Number(pkg.price) || 0,
        image: pkg.image || '',
      });
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent(CART_EVENT));
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- inject CSS once ----------
const CSS = `
.ibxn-card{position:relative;width:100%;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:#141414;cursor:pointer;transition:transform .3s ease,box-shadow .3s ease;will-change:transform;outline:none}
.ibxn-card:hover,.ibxn-card:focus-within{transform:scale(1.05);z-index:5;box-shadow:0 12px 32px rgba(0,0,0,.55)}
.ibxn-thumb{position:absolute;inset:0}
.ibxn-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.ibxn-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f2027,#203a43,#2c5364)}
.ibxn-fallback span{font-size:44px;font-weight:800;color:rgba(212,175,55,.85);font-family:Georgia,serif}
.ibxn-price{position:absolute;top:8px;right:8px;z-index:2;background:rgba(0,0,0,.72);color:#d4af37;font-weight:700;font-size:12px;line-height:1;padding:5px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.45);white-space:nowrap}
.ibxn-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 42%,rgba(0,0,0,.88) 100%)}
.ibxn-info{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;z-index:2}
.ibxn-title{margin:0;font-size:14px;font-weight:700;color:#fff;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.ibxn-desc{margin:0;font-size:12px;color:#d0d0d0;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-height:0;opacity:0;transition:max-height .25s ease,opacity .25s ease,margin .25s ease}
.ibxn-card:hover .ibxn-desc,.ibxn-card:focus-within .ibxn-desc{max-height:44px;opacity:1;margin:6px 0 2px}
.ibxn-actions{display:flex;align-items:center;gap:8px;margin-top:8px;opacity:0;transform:translateY(6px);transition:opacity .25s ease,transform .25s ease}
.ibxn-card:hover .ibxn-actions,.ibxn-card:focus-within .ibxn-actions{opacity:1;transform:translateY(0)}
.ibxn-view{display:inline-flex;align-items:center;gap:6px;background:#fff;color:#111;border:none;border-radius:4px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
.ibxn-view:hover{background:#e3e3e3}
.ibxn-cart,.ibxn-heart{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:rgba(20,20,20,.72);color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;flex:0 0 auto}
.ibxn-cart:hover,.ibxn-heart:hover{border-color:#fff}
.ibxn-heart.is-saved{color:#d4af37;border-color:#d4af37}
.ibxn-cart.is-added{color:#22c55e;border-color:#22c55e}
.ibxn-rank{position:absolute;left:0;top:0;bottom:0;width:32%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:3}
.ibxn-rank span{font-size:52px;font-weight:900;line-height:1;color:#0d0d0d;-webkit-text-stroke:2px #d4af37;text-shadow:0 2px 10px rgba(0,0,0,.65)}
@media (hover:none){.ibxn-desc,.ibxn-actions{display:none}.ibxn-rank span{font-size:40px}}
`;
if (typeof document !== 'undefined' && !document.getElementById('ibxn-card-css')) {
  const tag = document.createElement('style');
  tag.id = 'ibxn-card-css';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ============================================================
// PackageCard
// props:
//   pkg          — package object (_id/title/desc/price/image/category)
//   rank         — Popular row number (1..5 badge; 6+ ya null = no badge)
//   onOpen       — optional (pkg) => void  (View Details / card click)
//   onAddToCart  — optional (pkg) => void  (project cart hook-up)
//   saved        — optional controlled My List state (bool)
//   onToggleSave — optional (pkg) => void  (controlled My List toggle)
// ============================================================
export default function PackageCard({ pkg, rank = null, onOpen, onAddToCart, saved, onToggleSave }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const timerRef = useRef(null);

  const pid = pkg ? String(pkg._id || pkg.id || '') : '';

  // My List state: controlled (saved prop) ya localStorage synced
  useEffect(() => {
    if (saved !== undefined) {
      setInMyList(Boolean(saved));
      return undefined;
    }
    const sync = () => setInMyList(readMyList().includes(pid));
    sync();
    window.addEventListener(MYLIST_EVENT, sync);
    return () => window.removeEventListener(MYLIST_EVENT, sync);
  }, [saved, pid]);

  // cleanup "Added" timer
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!pkg) return null;

  const handleOpen = () => {
    if (typeof onOpen === 'function') onOpen(pkg);
    else navigate(`/package/${pid}`); // File 5 (App.jsx) me ye route ensure hoga
  };

  const handleHeart = (e) => {
    e.stopPropagation();
    if (typeof onToggleSave === 'function') {
      onToggleSave(pkg);
      return;
    }
    const nowSaved = toggleMyList(pid);
    setInMyList(nowSaved);
  };

  const handleCart = (e) => {
    e.stopPropagation();
    if (typeof onAddToCart === 'function') {
      onAddToCart(pkg);
    } else {
      addToCartStorage(pkg);
    }
    setJustAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustAdded(false), 1400);
  };

  const showRank = rank !== null && rank >= 1 && rank <= 5; // blueprint: sirf top 5 badges

  return (
    <article
      className="ibxn-card"
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') handleOpen(); }}
      role="button"
      tabIndex={0}
      aria-label={pkg.title}
    >
      {showRank && (
        <div className="ibxn-rank"><span>{rank}</span></div>
      )}

      <div className="ibxn-thumb">
        {imgError || !pkg.image ? (
          <div className="ibxn-fallback"><span>{String(pkg.title || 'P').charAt(0)}</span></div>
        ) : (
          <img
            src={pkg.image}
            alt={pkg.title || 'Package'}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="ibxn-shade" />
      <div className="ibxn-price">{formatPKR(pkg.price)}</div>

      <div className="ibxn-info">
        <h3 className="ibxn-title">{pkg.title}</h3>
        <p className="ibxn-desc">{pkg.desc}</p>
        <div className="ibxn-actions">
          <button type="button" className="ibxn-view" onClick={(e) => { e.stopPropagation(); handleOpen(); }}>
            <FiEye /> View Details
          </button>
          <button
            type="button"
            className={`ibxn-cart${justAdded ? ' is-added' : ''}`}
            onClick={handleCart}
            aria-label="Add to Cart"
            title="Add to Cart"
          >
            {justAdded ? <FiCheck /> : <FiShoppingBag />}
          </button>
          <button
            type="button"
            className={`ibxn-heart${inMyList ? ' is-saved' : ''}`}
            onClick={handleHeart}
            aria-label="My List"
            title="My List"
          >
            {inMyList ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
      </div>
    </article>
  );
}
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShoppingCart, FaCheck } from 'react-icons/fa';

/* --------------------------- storage: My List --------------------------- */

const MYLIST_EVENT = 'ibadahconnect:mylist-changed';
const CART_EVENT = 'ibadahconnect:cart-changed';

const MYLIST_KEY = 'ibadahconnect_mylist';
const CART_KEY = 'ibadahconnect_cart';

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    return [];
  }
}

function readMyList() {
  return readStore(MYLIST_KEY);
}

function readCart() {
  return readStore(CART_KEY);
}

const pkgId = (p) => String((p && (p._id || p.id)) || '');

function snapshotOf(p) {
  return {
    _id: pkgId(p),
    title: (p && p.title) || 'Untitled Package',
    price: p && p.price != null ? p.price : 0,
    image: (p && (p.image || p.img || p.imageUrl || p.thumbnail)) || '',
    category: (p && (p.category || p.categoryName)) || '',
  };
}

// Toggle a package in My List. Returns the updated list.
function toggleMyList(pkg) {
  const id = pkgId(pkg);
  const list = readMyList();
  if (!id) return list;
  const exists = list.some((x) => String(x && (x._id || x.id)) === id);
  let next;
  if (exists) {
    next = list.filter((x) => String(x && (x._id || x.id)) !== id);
  } else {
    next = list.concat([snapshotOf(pkg)]);
  }
  try {
    localStorage.setItem(MYLIST_KEY, JSON.stringify(next));
  } catch (err) {
    /* storage full or blocked - in-memory only */
  }
  window.dispatchEvent(new CustomEvent(MYLIST_EVENT));
  return next;
}

// Add a package to the localStorage cart. Returns the updated cart.
function addToCartStorage(pkg, qty) {
  const id = pkgId(pkg);
  const cart = readCart();
  if (!id) return cart;
  const q = Number(qty) > 0 ? Number(qty) : 1;
  const idx = cart.findIndex((x) => String(x && (x._id || x.id)) === id);
  if (idx >= 0) {
    cart[idx].qty = Number(cart[idx].qty || 1) + q;
  } else {
    cart.push(Object.assign(snapshotOf(pkg), { qty: q }));
  }
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (err) {
    /* storage full or blocked - in-memory only */
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
  return cart;
}

/* ------------------------------ CSS (once) ------------------------------ */

(function injectCardCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ibc-card-css')) return;

  const style = document.createElement('style');
  style.id = 'ibc-card-css';
  style.textContent = `
    .ibc-card {
      position: relative; background: #15151b; border: 1px solid #23232b;
      border-radius: 10px; overflow: hidden; cursor: pointer;
      transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
    }
    .ibc-card:hover {
      transform: scale(1.05); z-index: 5; border-color: #d4af37;
      box-shadow: 0 18px 34px rgba(0,0,0,.55);
    }
    .ibc-card:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; }

    .ibc-card-media { position: relative; aspect-ratio: 16 / 9; background: #0f0f14; }
    .ibc-card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ibc-card-fallback {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      font-size: 44px; font-weight: 800; color: #101014;
      background: linear-gradient(135deg, #e6c15c, #b8860b);
    }

    .ibc-card-rank {
      position: absolute; top: 6px; left: 6px; z-index: 2;
      min-width: 34px; height: 34px; padding: 0 7px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(16,16,20,.85); border: 1px solid #d4af37;
      color: #e6c15c; font-size: 19px; font-weight: 800;
    }
    .ibc-card-cat {
      position: absolute; top: 8px; right: 8px; z-index: 2;
      padding: 3px 8px; border-radius: 6px;
      background: rgba(16,16,20,.8); color: #c9c9d1;
      font-size: 10px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
    }

    /* hover overlay: desc + actions, no layout shift */
    .ibc-card-hover {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 3;
      padding: 26px 10px 10px;
      background: linear-gradient(180deg, rgba(10,10,12,0) 0%, rgba(10,10,12,.94) 62%);
      opacity: 0; transform: translateY(6px);
      transition: opacity .2s ease, transform .2s ease;
    }
    .ibc-card:hover .ibc-card-hover { opacity: 1; transform: translateY(0); }
    .ibc-card-desc {
      margin: 0 0 6px; font-size: 11.5px; line-height: 1.4; color: #c9c9d1;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .ibc-card-actions { display: flex; gap: 8px; }
    .ibc-iconbtn {
      width: 34px; height: 30px; display: flex; align-items: center; justify-content: center;
      border-radius: 6px; border: 1px solid rgba(255,255,255,.35);
      background: rgba(255,255,255,.12); color: #ffffff; cursor: pointer;
      transition: background .15s ease, color .15s ease, border-color .15s ease;
    }
    .ibc-iconbtn:hover { background: #f5f5f7; border-color: #f5f5f7; color: #101014; }
    .ibc-iconbtn.saved { background: #d4af37; border-color: #d4af37; color: #101014; }
    .ibc-iconbtn.added { background: #22c55e; border-color: #22c55e; color: #101014; }
    .ibc-iconbtn svg { font-size: 14px; pointer-events: none; }

    .ibc-card-body { padding: 10px 12px 12px; }
    .ibc-card-title {
      margin: 0; font-size: 13.5px; font-weight: 700; color: #f5f5f7;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ibc-card-price { margin-top: 5px; color: #d4af37; font-weight: 800; font-size: 13.5px; }

    /* touch devices: overlay always visible, no hover needed */
    @media (hover: none) {
      .ibc-card-hover { opacity: 1; transform: none; }
      .ibc-card:hover { transform: none; box-shadow: none; }
    }
  `;
  document.head.appendChild(style);
})();

/* -------------------------------- component ------------------------------- */

const fmtPKR = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK');

export default function PackageCard({ pkg, rank, onOpen, onAddToCart, saved, onToggleSave }) {
  const navigate = useNavigate();

  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const tickRef = useRef(null);

  const id = pkgId(pkg);
  const title = (pkg && pkg.title) || 'Untitled Package';
const desc = (pkg && (pkg.desc || pkg.description || pkg.shortDescription)) || '';
  const img = (pkg && (pkg.image || p_img(pkg))) || '';
  const catLabel = String((pkg && (pkg.category || pkg.categoryName)) || '')
    .trim()
    .toUpperCase();

  const rankNum = Number(rank);
  const showRank = Number.isFinite(rankNum) && rankNum >= 1 && rankNum <= 5;

  // saved: parent-managed if prop given, otherwise localStorage-managed
  useEffect(() => {
    if (saved !== undefined && saved !== null) {
      setLocalSaved(!!saved);
      return;
    }
    setLocalSaved(readMyList().some((x) => String(x && (x._id || x.id)) === id));
  }, [saved, id]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, []);

  const markAdded = () => {
    setAdded(true);
    if (tickRef.current) clearTimeout(tickRef.current);
    tickRef.current = setTimeout(() => setAdded(false), 1400);
  };

  const handleOpen = () => {
    if (!id) return;
    if (onOpen) onOpen(pkg);
    else navigate('/package/' + id);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(pkg);
      return;
    }
    const next = toggleMyList(pkg);
    setLocalSaved(next.some((x) => String(x && (x._id || x.id)) === id));
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart(pkg);
    else addToCartStorage(pkg, 1);
    markAdded();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      className="ibc-card"
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={title}
    >
      <div className="ibc-card-media">
        {img && !imgError ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="ibc-card-fallback">{title.charAt(0).toUpperCase()}</div>
        )}

        {showRank ? <span className="ibc-card-rank">{rankNum}</span> : null}
        {catLabel ? <span className="ibc-card-cat">{catLabel}</span> : null}

        <div className="ibc-card-hover">
          {desc ? <p className="ibc-card-desc">{desc}</p> : null}
          <div className="ibc-card-actions">
            <button
              type="button"
              className={`ibc-iconbtn${added ? ' added' : ''}`}
              aria-label="Add to cart"
              onClick={handleAdd}
            >
              {added ? <FaCheck /> : <FaShoppingCart />}
            </button>
            <button
              type="button"
              className={`ibc-iconbtn${localSaved ? ' saved' : ''}`}
              aria-label={localSaved ? 'Remove from My List' : 'Add to My List'}
              onClick={handleSave}
            >
              {localSaved ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>
        </div>
      </div>

      <div className="ibc-card-body">
        <h3 className="ibc-card-title">{title}</h3>
        <div className="ibc-card-price">{fmtPKR(pkg && pkg.price)}</div>
      </div>
    </article>
  );
}

function p_img(p) {
  return (p && (p.img || p.imageUrl || p.thumbnail)) || '';
}
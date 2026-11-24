import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  FaHeart, FaRegHeart, FaSearch, FaFire, FaKaaba,
  FaArrowRight, FaFolderOpen
} from 'react-icons/fa';
import API from '../api';

// ---------------- Filter chips ----------------
const FILTERS = [
  { id: 'all', label: 'All Services' },
  { id: 'umrah', label: 'Umrah Badal', keys: ['umrah'] },
  { id: 'hajj', label: 'Hajj Badal', keys: ['hajj'] },
  { id: 'donations', label: 'Donations' },
  { id: 'budget', label: 'Under PKR 5,000', priceCap: 5000 },
  { id: 'iftar', label: 'Iftar', keys: ['iftar', 'roza'], fire: true },
  { id: 'zamzam', label: 'Zamzam', keys: ['zamzam'], fire: true },
  { id: 'orphan', label: 'Orphan', keys: ['orphan', 'yatim'], fire: true },
  { id: 'eid', label: 'Eid', keys: ['eid'], fire: true },
  { id: 'quran', label: 'Quran', keys: ['quran'], fire: true }
];

const DONATION_KEYS = ['donat', 'sadqa', 'zakat', 'iftar', 'zamzam', 'orphan', 'yatim', 'eid', 'quran', 'wheelchair', 'tasbeeh', 'kaffara', 'aqeeqah', 'fidyah', 'nidhi'];

// Search haystack: category + title + desc
const getHay = (p) => `${p.category || ''} ${p.title || ''} ${p.desc || ''}`.toLowerCase();

const Dashboard = ({ openAuthModal }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ---------------- Fetch packages ----------------
  // NOTE: the old fixed "v4 OK - loaded N packages" debug bar (position:fixed, bottom-left)
  // was overlapping the featured banner buttons. It is replaced by an auto-hiding
  // top-center toast (z-index 9999) — same confirmation, zero overlap.
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await API.get('/packages/all');
        setPackages(res.data);
      } catch (err) {
        console.log('Packages fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // ---------------- MY BOOKINGS: sponsor's own orders (15s live refresh) ----------------
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const fetchOrders = async () => {
      try {
        const res = await API.get(`/orders/my-orders/${userId}`);
        setMyOrders(res.data);
      } catch (err) { console.log('Orders fetch error'); }
      finally { setLoadingOrders(false); }
    };
    fetchOrders();
    const t = setInterval(fetchOrders, 15000);
    return () => clearInterval(t);
  }, [user?.id]);

  // ---------------- Wishlist ----------------
  const toggleWishlist = (item) => {
    let currentWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const exists = currentWishlist.find(w => w.id === item.id);
    if (exists) {
      currentWishlist = currentWishlist.filter(w => w.id !== item.id);
    } else {
      currentWishlist.push(item);
    }
    localStorage.setItem('wishlist', JSON.stringify(currentWishlist));
    setWishlist(currentWishlist);
  };

  // ---------------- Derived data ----------------
  // Featured = VIP package if present, otherwise the most expensive one
  const featured = packages.find(p => /vip/i.test(p.title)) || [...packages].sort((a, b) => b.price - a.price)[0];

  const visible = packages.filter(p => {
    const hay = getHay(p);
    const q = query.trim().toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (active === 'all') return true;
    const f = FILTERS.find(x => x.id === active);
    if (!f) return true;
    if (f.priceCap) return p.price < f.priceCap;
    if (f.id === 'donations') {
      const isCore = hay.includes('umrah badal') || hay.includes('hajj badal');
      const isDonation = DONATION_KEYS.some(k => hay.includes(k));
      return isDonation || !isCore;
    }
    return (f.keys || []).some(k => hay.includes(k));
  });

  const activeLabel = (FILTERS.find(f => f.id === active) || FILTERS[0]).label;

  const handleBookFeatured = () => {
    if (!featured) return;
    if (!user) { openAuthModal(); return; }
    navigate(`/checkout/${featured._id}`);
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const badge = {
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Assigned': 'bg-purple-100 text-purple-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700'
  };

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">

      {/* ================= DARK HEADER BLOCK (brand + search + filter chips) ================= */}
      <div
        className="px-6 md:px-10 pt-8"
        style={{ background: 'radial-gradient(1100px 420px at 85% -20%, rgba(212,175,55,0.14), transparent 60%), #0A2B23' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center flex-shrink-0">
              <FaKaaba className="text-accent text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white leading-tight">IbadahConnect</h1>
              <p className="text-[10px] font-bold tracking-[0.35em] text-accent/80 uppercase mt-0.5">Badal Services &amp; Donations</p>
            </div>
          </div>

          <div className="relative w-full md:w-[400px]">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search umrah, hajj, iftar, zamzam, orphan..."
              className="w-full bg-white/[0.06] border border-white/15 rounded-full pl-11 pr-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-accent/60 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Filter chips row */}
        <div className="flex items-center flex-wrap gap-2.5 mt-7 pb-7">
          {FILTERS.map((f, i) => (
            <span key={f.id} className="flex items-center gap-2.5">
              {i === 5 && <span className="hidden lg:block w-px h-6 bg-white/15 mx-1"></span>}
              <button
                onClick={() => setActive(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  active === f.id
                    ? 'bg-accent text-[#0A2B23] shadow-lg shadow-accent/20'
                    : 'bg-white/[0.07] text-white/85 border border-white/10 hover:border-accent/50 hover:text-white'
                }`}
              >
                {f.fire && <FaFire className={active === f.id ? 'text-[#0A2B23]' : 'text-accent'} />}
                {f.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="p-6 md:p-10">

        {/* ---------- FEATURED BANNER ---------- */}
        {featured && (
          <div className="relative rounded-3xl overflow-hidden mb-10 shadow-2xl aspect-[21/9] min-h-[420px]">
            <img src={featured.image} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent"></div>
            <div className="absolute inset-0 flex items-center">
              <div className="p-8 md:p-14 max-w-2xl">
                <span className="inline-flex items-center gap-2 bg-black/40 border border-accent/60 text-accent text-[10px] font-bold px-4 py-1.5 rounded-full mb-5 tracking-[0.25em] uppercase">
                  <FaFire /> Featured Ibadah
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{featured.title}</h2>
                <p className="text-white/80 text-sm md:text-base mb-5 max-w-xl leading-relaxed">{featured.desc}</p>
                <p className="text-2xl md:text-3xl font-black text-accent mb-7">PKR {featured.price.toLocaleString()}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/service/${featured._id}`}
                    className="bg-white text-gray-900 font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 text-sm flex items-center gap-2"
                  >
                    View Details <FaArrowRight className="text-xs" />
                  </Link>
                  <button
                    onClick={handleBookFeatured}
                    className="bg-accent text-[#0A2B23] font-bold px-7 py-3 rounded-full hover:brightness-110 transition-all duration-300 text-sm shadow-lg shadow-accent/25"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- GRID HEADING ---------- */}
        <div className="flex justify-between items-end mb-6 flex-wrap gap-3">
          <h3 className="text-2xl font-black text-gray-900">{activeLabel}</h3>
          {!loading && (
            <span className="bg-white border border-gray-100 rounded-full px-4 py-1.5 text-xs font-bold text-gray-500 shadow-sm">
              {visible.length} {visible.length === 1 ? 'service' : 'services'}
            </span>
          )}
        </div>

        {/* ---------- PACKAGE GRID ---------- */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-3 w-full bg-gray-100 rounded"></div>
                  <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                  <div className="h-10 w-full bg-gray-100 rounded-xl mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-16">
            <FaSearch className="text-3xl text-gray-300 mx-auto mb-4" />
            <p className="font-bold text-gray-700 mb-1">No services found</p>
            <p className="text-gray-400 text-sm mb-5">Try a different filter or search keyword.</p>
            <button
              onClick={() => { setActive('all'); setQuery(''); }}
              className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all text-sm"
            >
              Show All Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {visible.map(pkg => {
              const itemData = { id: pkg._id, name: pkg.title, price: pkg.price, img: pkg.image, desc: pkg.desc };
              return (
                <div key={pkg._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <h4 className="absolute bottom-3 left-4 right-12 text-lg font-extrabold text-white leading-tight">{pkg.title}</h4>
                    <button
                      onClick={() => toggleWishlist(itemData)}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      {wishlist.find(w => w.id === itemData.id) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-700" />}
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xl font-black text-primary mb-2">PKR {pkg.price.toLocaleString()}</span>
                    <p className="text-gray-500 text-sm mb-5 flex-1 line-clamp-2">{pkg.desc}</p>
                    <Link
                      to={`/service/${pkg._id}`}
                      className="w-full bg-primary/5 border border-primary/15 text-primary font-bold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 text-sm flex items-center justify-center gap-2"
                    >
                      View Details <FaArrowRight className="text-xs" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= MY BOOKINGS (live order tracking list) ================= */}
        <div id="my-bookings" className="flex justify-between items-end mb-6 scroll-mt-24">
          <h3 className="text-2xl font-black text-gray-900">My Bookings</h3>
        </div>

        {loadingOrders ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm font-semibold mb-16">Loading your bookings...</div>
        ) : myOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center mb-16">
            <FaFolderOpen className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700 mb-1">No bookings yet</p>
            <p className="text-gray-400 text-sm mb-5">Book your first service and track its live progress right here.</p>
            <button onClick={scrollToTop} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all text-sm">Browse Services</button>
          </div>
        ) : (
          <div className="space-y-4 mb-16">
            {myOrders.map(o => {
              const done = (o.milestones || []).filter(m => m.isCompleted).length;
              const total = (o.milestones || []).length || 1;
              const pct = Math.round((done / total) * 100);
              return (
                <div key={o._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-extrabold text-gray-900">{o.packageTitle || o.serviceType}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                      {o.rating?.stars && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{o.rating.stars}/5</span>}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">For: {o.recipientName} &bull; Booked {new Date(o.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{done}/{total} steps ({pct}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Performer</p>
                      <p className="text-sm font-bold text-gray-700">{o.performer ? `${o.performer.firstName} ${o.performer.lastName}` : 'Assigning soon...'}</p>
                    </div>
                    <button onClick={() => navigate(`/track/${o._id}`)} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all text-sm flex items-center gap-2">
                      Track <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
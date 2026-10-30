import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000';

const imgUrl = (img) => (img && String(img).startsWith('/uploads') ? `${API}${img}` : img || '/images/umrah1.jpg');

/* Har service ki APNI detail — DB ka koi bhi field ho, card pe show hoga
   (backend desc bhejta hai ya description/details — teeno handle hain) */
const titleOf = (p) => p.title || p.name || 'Ibadah Badal';
const descOf = (p) =>
  p.desc || p.description || p.details ||
  'Performed in Makkah by a CNIC-verified performer with photo & video proof.';

const Dashboard = () => {
  const [pkgs, setPkgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('All');
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`${API}/api/packages/all`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list = Array.isArray(d) ? d : (d.packages || d.data || []);
        setPkgs(list);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError('Could not load services. Please make sure the backend server is running.');
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const categories = ['All', ...new Set(pkgs.map((p) => p.category).filter(Boolean))];
  const filtered = cat === 'All' ? pkgs : pkgs.filter((p) => p.category === cat);

  // Cart format bilkul CartPage ke mutabiq: { id, name, desc, price, img }
  const addToCart = (p) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (!cart.some((i) => i.id === p._id)) {
        cart.push({ id: p._id, name: titleOf(p), desc: descOf(p), price: p.price || 0, img: imgUrl(p.image) });
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartChanged'));
      }
      setAddedId(p._id);
      setTimeout(() => setAddedId(null), 1600);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B5E20] text-[#D4AF37] text-[11px] font-bold uppercase tracking-widest ring-1 ring-[#D4AF37]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            Sacred Services
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-[#0F3D14]" style={{ fontFamily: 'Amiri, serif' }}>All Services</h1>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            Umrah Badal, Hajj Badal and Sadaqah donations — every service is performed by CNIC-verified performers in Makkah, with milestone updates and photo &amp; video proof.
          </p>
        </div>

        {/* category pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                cat === c
                  ? 'bg-[#1B5E20] text-white ring-1 ring-[#D4AF37]/60 shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#D4AF37] hover:text-[#1B5E20]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">{filtered.length} Services</p>

        {/* services grid */}
        {loading ? (
          <p className="text-center text-gray-400 py-24 font-semibold">Loading services...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-24 font-semibold">{error}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {filtered.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl overflow-hidden border border-[#0F3D14]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <Link to={`/service/${p._id}`} className="relative block">
                  <img src={imgUrl(p.image)} alt={titleOf(p)} className="w-full h-44 object-cover" />
                  {p.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-bold uppercase tracking-wide text-[#1B5E20] ring-1 ring-[#D4AF37]/40">
                      {p.category}
                    </span>
                  )}
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <Link to={`/service/${p._id}`} className="hover:text-[#1B5E20] transition-colors">
                    <h3 className="font-bold text-gray-900 leading-snug" style={{ fontFamily: 'Amiri, serif' }}>{titleOf(p)}</h3>
                  </Link>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed flex-1">{descOf(p)}</p>
                  <div className="flex items-end justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Starting from</p>
                      <p className="text-[#1B5E20] font-extrabold text-lg leading-tight">PKR {(p.price || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                        addedId === p._id
                          ? 'bg-[#D4AF37] text-[#1B5E20] ring-1 ring-[#D4AF37]'
                          : 'bg-[#1B5E20] text-white ring-1 ring-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#1B5E20]'
                      }`}
                    >
                      {addedId === p._id ? 'Added ✓' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-24 font-semibold">No services in this category yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
export { Dashboard };
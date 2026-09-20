import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Services' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/faqs', label: 'FAQs' },
];

/* ---------------- inline SVG icons (no emoji, no extra deps) ---------------- */

const BellIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="17" cy="20" r="1.5" />
    <path d="M3 4h2l2.4 11.2a1.5 1.5 0 001.5 1.3h7.9a1.5 1.5 0 001.5-1.2L20 8H6" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7.5-4.7-9.8-9.2C.7 8.6 2.6 5 6.1 5c2.1 0 3.5 1.1 4.4 2.6h3c.9-1.5 2.3-2.6 4.4-2.6 3.5 0 5.4 3.6 3.9 6.8C19.5 16.3 12 21 12 21z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);

const DocIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" />
    <path d="M14 2v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/* --------------------------------- NAVBAR ---------------------------------- */

const Navbar = ({ openModal }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  // Bahar click karne pe menu band karna
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll pe halka shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  const itemCls = 'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50/70 hover:text-[#1B5E20] transition-colors cursor-pointer';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-emerald-900/[0.08] border-emerald-900/10' : 'shadow-sm border-gray-100'}`}>
      <style>{`@keyframes navDrop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">

        {/* logo — golden star, same everywhere */}
        <Link to="/" onClick={() => setMobileOpen(false)} className="shrink-0">
          <BrandLogo variant="dark" size="md" />
        </Link>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`relative group text-sm font-semibold transition-colors ${isActive(l.to) ? 'text-[#1B5E20]' : 'text-gray-600 hover:text-[#1B5E20]'}`}
            >
              {l.label}
              <span className={`absolute -bottom-1.5 left-0 h-[2px] rounded-full bg-[#D4AF37] transition-all duration-300 ${isActive(l.to) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button title="Notifications" className="relative p-2 text-gray-500 hover:text-[#1B5E20] transition-colors">
                <BellIcon />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>

              {/* Profile Dropdown — all sections */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2.5 bg-gray-50 pl-2.5 pr-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-100">
                  <span className="text-sm font-bold text-gray-800 hidden md:block">{user?.firstName}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                  </div>
                  <ChevronIcon open={menuOpen} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden origin-top-right animate-[navDrop_.18s_ease-out]">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 to-transparent">
                      <p className="text-sm font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <GridIcon /> Dashboard
                    </Link>
                    <Link to="/track" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <BoxIcon /> My Orders
                    </Link>
                    <Link to="/cart" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <CartIcon /> Cart
                    </Link>
                    <Link to="/wishlist" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <HeartIcon /> Wishlist
                    </Link>
                    <Link to="/reminders" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <CalendarIcon /> Reminders
                    </Link>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <UserIcon /> My Profile
                    </Link>
                    <Link to="/personal-info" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <DocIcon /> Personal Information
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border-t border-gray-100 mt-1 cursor-pointer">
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button onClick={openModal} className="bg-[#1B5E20] text-white font-bold px-5 py-2.5 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#1B5E20] hover:shadow-lg hover:shadow-[#D4AF37]/40 transition-all duration-300 text-sm">
              Login / Sign Up
            </button>
          )}

          {/* mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600 hover:text-[#1B5E20] transition-colors">
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-xl">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive(l.to) ? 'bg-emerald-50 text-[#1B5E20]' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cart</Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Wishlist</Link>
              <Link to="/track" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">My Orders</Link>
            </>
          )}
          {!user && (
            <button
              onClick={() => { setMobileOpen(false); if (openModal) openModal(); }}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#1B5E20] text-white font-bold text-sm ring-1 ring-[#D4AF37]/60"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
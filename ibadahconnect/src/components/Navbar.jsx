import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import API from '../api';
import { getCurrentUser, logout } from '../utils/auth';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'All Services' },
  { to: '/how-it-works', label: 'About Us' },
  { to: '/guide', label: 'Guidelines' },
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

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
    <path d="M9.5 12l1.8 1.8 3.7-3.8" />
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
  <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

/* ------- Role ke hisaab se extra links (sirf confirmed routes) ------- */

const getRoleLinks = (role) => {
  if (role === 'Admin') {
    return [{ to: '/admin/cnic', label: 'CNIC Requests', Icon: ShieldIcon }];
  }
  if (role === 'Performer') {
    return [{ to: '/cnic-verify', label: 'Verify CNIC', Icon: ShieldIcon }];
  }
  return [];
};

/* --------------------------------- NAVBAR ---------------------------------- */

const Navbar = ({ openModal }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  // Cart
  const [cartCount, setCartCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  const role = user?.role || 'Sponsor';
  const roleLinks = getRoleLinks(role);
  const initial = user?.firstName ? user.firstName[0].toUpperCase() : 'U';

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  useEffect(() => {
    if (!user || role !== 'Sponsor') {
      setNotifications([]);
      return undefined;
    }
    let alive = true;
    const refreshNotifications = async () => {
      try {
        const { data } = await API.get('/orders/mine');
        const orders = Array.isArray(data) ? data : data.orders || [];
        const items = [];
        orders.forEach((order) => {
          const code = order.orderCode || order._id;
          const who = order.name || order.beneficiaryName || 'your loved one';
          const time = order.updatedAt || order.createdAt;
          if (order.status === 'Completed') {
            items.push({ id: `${order._id}-done`, title: 'Ibadah completed', body: `Order ${code} has been completed.`, time });
          } else if (['In Progress', 'Assigned'].includes(order.status)) {
            items.push({ id: `${order._id}-progress`, title: 'Ibadah in progress', body: `The Ibadah for ${who} (${code}) is being performed.`, time });
          } else if (order.paymentStatus === 'Paid') {
            items.push({ id: `${order._id}-paid`, title: 'Payment received', body: `We have received payment for order ${code}.`, time: order.paidAt || time });
          } else if (order.createdAt) {
            items.push({ id: `${order._id}-booked`, title: 'Booking confirmed', body: `Your booking for ${who} (${code}) is confirmed.`, time: order.createdAt });
          }
        });
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        if (alive) setNotifications(items);
      } catch (error) {
        if (alive) setNotifications([]);
      }
    };
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 30000);
    return () => { alive = false; clearInterval(timer); };
  }, [role, user?.id]);

  // Cart count (localStorage) — cart badalne pe navbar badge khud update
  const refreshCart = () => {
    try {
      const c = JSON.parse(localStorage.getItem('cart')) || [];
      setCartCount(Array.isArray(c) ? c.length : 0);
    } catch (e) { setCartCount(0); }
  };
  useEffect(() => {
    refreshCart();
    window.addEventListener('cartChanged', refreshCart);
    window.addEventListener('storage', refreshCart);
    return () => {
      window.removeEventListener('cartChanged', refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, []);
  useEffect(() => { refreshCart(); }, [location.pathname]);

  // Route change hote hi sab menus band
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape key se menu band
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Bahar click karne pe menus band
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationOpen(false);
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

  const isActive = (to) => {
    if (!to) return false;
    return to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  };

  const itemCls = 'group flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1B5E20] transition-colors cursor-pointer';

  const sectionLbl = 'px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400';


  // Cart button (logged in / out dono ke liye)
  const cartBtn = (
    <Link to="/cart" title="Cart" className="relative p-2 text-gray-500 hover:text-[#1B5E20] transition-colors">
      <CartIcon />
      {cartCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4AF37] text-[#1B5E20] text-[10px] font-bold flex items-center justify-center border-2 border-white">
          {cartCount}
        </span>
      )}
    </Link>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-emerald-900/[0.08] border-emerald-900/10' : 'shadow-sm border-gray-100'}`}>
      <style>{`@keyframes navDrop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>

      {/* golden accent line — brand touch */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent pointer-events-none" />

      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">

        {/* logo — golden star, same everywhere */}
        <Link to="/" onClick={() => setMobileOpen(false)} className="shrink-0">
          <BrandLogo variant="dark" size="md" />
        </Link>

        {/* desktop links — flex-1 + justify-center = menu hamesha beech m centered */}
        <div className="hidden xl:flex flex-1 items-center justify-center gap-1.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`relative group flex items-center px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                isActive(l.to)
                  ? 'bg-emerald-50 text-[#1B5E20]'
                  : 'text-gray-600 hover:text-[#1B5E20] hover:bg-gray-50'
              }`}
            >
              {l.label}
              <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-[#D4AF37] transition-all duration-300 ${isActive(l.to) ? 'w-5' : 'w-0 group-hover:w-5'}`} />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Book Now — gold CTA */}
              <Link to="/dashboard" className="hidden xl:inline-flex items-center bg-[#D4AF37] text-[#1B5E20] font-bold px-5 py-2.5 rounded-full text-sm ring-1 ring-[#D4AF37]/60 hover:bg-[#1B5E20] hover:text-white hover:shadow-lg hover:shadow-[#D4AF37]/40 hover:scale-[1.03] transition-all duration-300">
                Book Now
              </Link>

              {cartBtn}

              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  title="Notifications"
                  aria-label="Notifications"
                  aria-expanded={notificationOpen}
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative p-2 text-gray-500 hover:text-[#1B5E20] transition-colors"
                >
                  <BellIcon />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C8A94B] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-full mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-emerald-950/10 overflow-hidden" style={{ animation: 'navDrop .16s ease-out both' }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Notifications</p>
                        <p className="text-xs text-gray-400 mt-0.5">Latest Ibadah updates</p>
                      </div>
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="text-xs font-bold text-[#1B5E20] hover:text-[#8a6d1a]"
                      >
                        View all
                      </Link>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <p className="text-sm font-bold text-gray-700">No new notifications</p>
                        <p className="text-xs text-gray-400 mt-1">Your Ibadah updates will appear here.</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {notifications.slice(0, 6).map((notification) => (
                          <Link
                            key={notification.id}
                            to="/notifications"
                            onClick={() => setNotificationOpen(false)}
                            className="block px-5 py-4 hover:bg-gray-50 transition-colors"
                          >
                            <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.body}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2.5 bg-gray-50 pl-2.5 pr-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-100">
                  <span className="text-sm font-bold text-gray-800 hidden xl:block">{user?.firstName}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] ring-2 ring-[#D4AF37]/50 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {initial}
                  </div>
                  <ChevronIcon open={menuOpen} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] origin-top-right animate-[navDrop_.18s_ease-out]">
                    {/* header: avatar + name + email + role */}
                    <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] flex items-center justify-center text-white font-bold shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                        {role}
                      </span>
                    </div>

                    {/* v8.2: scrollable menu — chhoti screen par bhi poori list scroll se accessible */}
                    <div className="py-1.5 overflow-y-auto">
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

                    {/* role-specific tools */}
                    {roleLinks.length > 0 && (
                      <>
                        <p className={sectionLbl}>{role} Tools</p>
                        {roleLinks.map(({ to, label, Icon }) => (
                          <Link key={to} to={to} onClick={() => setMenuOpen(false)} className={itemCls}>
                            <Icon /> {label}
                          </Link>
                        ))}
                      </>
                    )}

                    {/* account */}
                    <p className={sectionLbl}>Account</p>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <UserIcon /> My Profile
                    </Link>
                    <Link to="/personal-info" onClick={() => setMenuOpen(false)} className={itemCls}>
                      <DocIcon /> Personal Information
                    </Link>

                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 border-t border-gray-100 mt-1 cursor-pointer transition-colors">
                      <LogoutIcon /> Logout
                    </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Book Now — gold CTA (logged out) */}
              <Link to="/dashboard" className="hidden xl:inline-flex items-center bg-[#D4AF37] text-[#1B5E20] font-bold px-5 py-2.5 rounded-full text-sm ring-1 ring-[#D4AF37]/60 hover:bg-[#1B5E20] hover:text-white hover:shadow-lg hover:shadow-[#D4AF37]/40 hover:scale-[1.03] transition-all duration-300">
                Book Now
              </Link>

              {cartBtn}

              <button onClick={openModal} className="bg-[#1B5E20] text-white font-bold px-5 py-2.5 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#1B5E20] hover:shadow-lg hover:shadow-[#D4AF37]/40 hover:scale-[1.03] transition-all duration-300 text-sm">
                Login / Sign Up
              </button>
            </>
          )}

          {/* mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="xl:hidden p-2 text-gray-600 hover:text-[#1B5E20] transition-colors">
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* mobile menu panel */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
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

          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="block mt-1 px-3 py-2.5 rounded-xl bg-[#D4AF37] text-[#1B5E20] font-bold text-sm text-center ring-1 ring-[#D4AF37]/60"
          >
            Book Now
          </Link>
<div className="navDrop">
  <span>Guide ▾</span>
  <div className="navDrop-menu">
    <button onClick={() => navigate("/guide/umrah-badal")}>Umrah Badal Guide</button>
    <button onClick={() => navigate("/guide/hajj-badal")}>Hajj Badal Guide</button>
    <button onClick={() => navigate("/guide/donations")}>Donations Guide</button>
  </div>
</div>
          {user ? (
            <>
              <p className={sectionLbl}>Account</p>
              <Link to="/track" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">My Orders</Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cart</Link>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Wishlist</Link>
              <Link to="/reminders" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Reminders</Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">My Profile</Link>
              <Link to="/personal-info" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Personal Information</Link>

              {roleLinks.length > 0 && (
                <>
                  <p className={sectionLbl}>{role} Tools</p>
                  {roleLinks.map(({ to, label }) => (
                    <Link key={to} to={to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1B5E20] hover:bg-emerald-50">{label}</Link>
                  ))}
                </>
              )}

              <button onClick={handleLogout} className="w-full mt-2 py-2.5 rounded-xl bg-red-50 text-red-500 font-bold text-sm">
                Logout
              </button>
            </>
          ) : (
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

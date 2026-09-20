import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import API from '../api';

// ====================================================================
// Helpers + Track My Order side drawer (with full detailing)
// ====================================================================
const TRACK_STATUS_STYLES = {
  Paid: 'bg-green-100 text-green-700',
  Unpaid: 'bg-red-100 text-red-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Pending: 'bg-gray-100 text-gray-600',
};

const PAY_LABEL = {
  Paid: 'Payment Confirmed',
  'Under Review': 'Payment Under Review',
  Unpaid: 'Payment Pending',
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-gray-400 flex-shrink-0">{label}</span>
    <span className="font-semibold text-gray-700 text-right break-all">{value || '—'}</span>
  </div>
);

const TrackDrawer = ({ open, onClose, presetOrder }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const uid = user?.id || user?._id;
  const [code, setCode] = useState(localStorage.getItem('lastOrderId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);

  // Drawer khulte hi user ke orders ki quick chips load (endpoint na ho to chup-chaap skip)
  useEffect(() => {
    if (!open || !uid) return;
    const loadMine = async () => {
      const endpoints = [`/orders?userId=${uid}`, `/orders/my?userId=${uid}`, `/orders/user/${uid}`];
      for (const ep of endpoints) {
        try {
          const res = await API.get(ep);
          const list = res.data?.orders || res.data;
          if (Array.isArray(list)) { setMyOrders(list.slice(0, 6)); return; }
        } catch (err) { /* next endpoint */ }
      }
    };
    loadMine();
  }, [open, uid]);

  // My Active Order card se aya hua order seedha show karo
  useEffect(() => {
    if (open && presetOrder) { setOrder(presetOrder); setError(''); }
  }, [open, presetOrder]);

  const track = async (rawCode) => {
    const c = (rawCode || code || '').trim();
    if (!c) { setError('Please enter your Order ID first.'); return; }
    setLoading(true); setError(''); setOrder(null);
    const endpoints = [`/orders/track/${encodeURIComponent(c)}`, `/orders/code/${encodeURIComponent(c)}`, `/orders/${encodeURIComponent(c)}`];
    let found = null;
    for (const ep of endpoints) {
      try {
        const res = await API.get(ep);
        const d = res.data?.order || res.data?.data?.order || res.data;
        if (d && (d._id || d.orderCode)) { found = d; break; }
      } catch (err) { /* next endpoint */ }
    }
    setLoading(false);
    if (found) setOrder(found);
    else setError('Order not found. Check the Order ID (e.g. IC-2025-123456).');
  };

  const lat = order?.proofLocation?.lat;
  const lng = order?.proofLocation?.lng;

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Track My Order</h3>
            <p className="text-xs text-gray-400 mt-0.5">Live status, performer location, milestones and proof.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="IC-2025-XXXXXX"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => track()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? '...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}

          {myOrders.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Recent Orders</p>
              <div className="flex flex-wrap gap-2">
                {myOrders.map((o, i) => {
                  const oc = o.orderCode || o.orderId || o._id;
                  return (
                    <button
                      key={o._id || i}
                      onClick={() => { setCode(oc); track(oc); }}
                      className="px-3 py-1.5 rounded-full bg-gray-50 text-primary text-xs font-bold border border-gray-100 hover:bg-primary hover:text-white transition-colors"
                    >
                      {oc}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {order && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-gray-900">#{order.orderCode || order._id}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${TRACK_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${TRACK_STATUS_STYLES[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {PAY_LABEL[order.paymentStatus] || order.paymentStatus || '—'}
                  </span>
                  {order.amount ? <span className="text-sm font-extrabold text-primary">PKR {Number(order.amount).toLocaleString()}</span> : null}
                </div>
              </div>

              {/* Full detailing */}
              <div className="rounded-2xl border border-gray-100 p-4 space-y-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Details</p>
                <DetailRow label="Booking ID" value={'#' + (order.orderCode || order._id)} />
                <DetailRow label="Service" value={order.service || order.serviceName || order.package || 'Badal Service'} />
                <DetailRow label="Amount" value={order.amount ? 'PKR ' + Number(order.amount).toLocaleString() : '—'} />
                <DetailRow label="Payment Method" value={order.paymentMethod || '—'} />
                <DetailRow label="Payment Ref" value={order.paymentRef || '—'} />
                <DetailRow label="Performer" value={order.performer?.name || (order.performer ? 'Assigned' : 'Not assigned yet')} />
                <DetailRow label="Booked On" value={order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'} />
              </div>

              {Array.isArray(order.milestones) && order.milestones.length > 0 && (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Milestones</p>
                  <div className="space-y-3">
                    {order.milestones.map((m, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${m.checkedAt ? 'bg-primary' : 'bg-gray-200'}`} />
                        <div>
                          <p className="text-sm font-bold text-gray-800">{m.title}</p>
                          {m.checkedAt
                            ? <p className="text-xs text-gray-400">{new Date(m.checkedAt).toLocaleString()}</p>
                            : <p className="text-xs text-gray-300">Pending</p>}
                          {Array.isArray(m.proofOcr?.matched) && m.proofOcr.matched.length > 0 && (
                            <p className="text-[10px] text-green-600 font-bold mt-0.5">Verified: {m.proofOcr.matched.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.proofPhotoUrl && (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Proof Photo</p>
                  <img src={order.proofPhotoUrl} alt="Proof" className="rounded-xl w-full object-cover" />
                </div>
              )}

              {lat && lng && (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Performer Live Location</p>
                  <iframe
                    title="order-location"
                    src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                    className="w-full h-44 rounded-xl border-0"
                    loading="lazy"
                  />
                </div>
              )}

              {order.receiptUrl && (
                <a href={order.receiptUrl} download className="block text-center w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all">
                  Download Receipt
                </a>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
// ===================== SECTION END =====================

// ====================================================================
// Inline SVG icon set — saare emoji icons replaced (Navbar jaisa style)
// ====================================================================
const Icon = ({ children, className = 'w-[18px] h-[18px] flex-shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{children}</svg>
);

const HomeIcon = (p) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></Icon>;
const KaabaIcon = (p) => <Icon {...p}><rect x="4" y="5" width="16" height="15" rx="1.5" /><path d="M4 9.5h16" /><path d="M10.5 20v-5h3v5" /></Icon>;
const PackageIcon = (p) => <Icon {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></Icon>;
const CartIcon = (p) => <Icon {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Icon>;
const HeartIcon = (p) => <Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></Icon>;
const CalendarIcon = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>;
const GiftIcon = (p) => <Icon {...p}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></Icon>;
const BellIcon = (p) => <Icon {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Icon>;
const UserIcon = (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>;
const SettingsIcon = (p) => <Icon {...p}><path d="M21 4h-7" /><path d="M10 4H3" /><path d="M21 12h-9" /><path d="M8 12H3" /><path d="M21 20h-5" /><path d="M12 20H3" /><circle cx="12" cy="4" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="14" cy="20" r="2" /></Icon>;
const HelpIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>;
const LogoutIcon = (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>;
const DropletIcon = (p) => <Icon {...p}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></Icon>;
const BowlIcon = (p) => <Icon {...p}><path d="M4 12a8 8 0 0 0 16 0" /><line x1="2" y1="12" x2="22" y2="12" /></Icon>;
const BookOpenIcon = (p) => <Icon {...p}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Icon>;
const CheckCircleIcon = (p) => <Icon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Icon>;
const ShieldIcon = (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>;
const StarIcon = (p) => <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>;
const MapPinIcon = (p) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></Icon>;

const Dashboard = ({ openAuthModal }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const uid = user?.id || user?._id;
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [packages, setPackages] = useState([]);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [presetOrder, setPresetOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  // New Booking: pehle SERVICE SELECTION modal khulta hai
  const handleBookClick = () => {
    if (!user) { openAuthModal(); } else { setShowServiceModal(true); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleNav = (action) => {
    if (action === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (action === 'orders') { setPresetOrder(null); setTrackOpen(true); }
    else if (action === 'donations') document.getElementById('donations')?.scrollIntoView({ behavior: 'smooth' });
    else if (action === 'notifications') document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth' });
    else showToast('This section is coming soon!');
  };

  // Wishlist se item add/remove karne ka function
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

  // Cart mein item add karne ka function
  const handleAddToCart = (item) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  const inspirations = [
    { title: "Hadith of the Day", text: "رسول اللہ ﷺ نے فرمایا :'' جنت کے آٹھ دروازے ہیں ، ان میں سے ایک دروازے کا نام '' الریان '' ہے ، اس میں سے صرف روزہ دار ہی داخل ہوں گے۔''", img: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop" },
    { title: "Ayat of the Day", text: "اے ایمان والو ! تم پر روزے فرض کردیئے گئے ہیں ، جس طرح تم سے پہلے لوگوں پر فرض کیے گئے تھے ، تاکہ تمہارے اندر تقوی پیدا ہو", img: "https://images.unsplash.com/photo-1565728744382-61accd4aa148?q=80&w=800&auto=format&fit=crop" }
  ];

  useEffect(() => {
    const fetchPackages = async () => {
      try { const res = await API.get('/packages/all'); setPackages(res.data); } catch (err) { console.log("Err"); }
    };
    fetchPackages();
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % inspirations.length); }, 5000);
    return () => clearInterval(timer);
  }, []);

  // My Active Order load karo (sabse naya / chal raha order)
  useEffect(() => {
    if (!uid) return;
    const loadActive = async () => {
      const endpoints = [`/orders?userId=${uid}`, `/orders/my?userId=${uid}`, `/orders/user/${uid}`];
      for (const ep of endpoints) {
        try {
          const res = await API.get(ep);
          const list = res.data?.orders || res.data;
          if (Array.isArray(list) && list.length > 0) {
            const active = list.find(o => o.status === 'In Progress') || list.find(o => o.status === 'Pending') || list[0];
            setActiveOrder(active);
            return;
          }
        } catch (err) { /* next endpoint */ }
      }
    };
    loadActive();
  }, [uid]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const otherServices = [
    { id: "hajj-badal", name: "Hajj Badal", price: 300000, desc: "Fulfill the ultimate pillar of Islam.", img: "/images/hajj.jpg", btn: "View Details" },
    { id: "wheelchair", name: "Wheelchair Donation", price: 25000, desc: "Donate a wheelchair to Masjid al-Haram.", img: "/images/wheelchair.jpg", btn: "Add to Cart" },
    { id: "roza-kushai", name: "Roza Kushai (Iftar)", price: 5000, desc: "Arrange Iftar for a fasting person.", img: "/images/roza.jpg", btn: "Add to Cart" },
    { id: "tasbeeh", name: "Tasbeeh Distribution", price: 400, desc: "Distribute prayer beads in Haram.", img: "/images/tasbeeh.jpg", btn: "Add to Cart" },
    { id: "zamzam", name: "Ab-e-Zamzam Delivery", price: 8000, desc: "Arrange pure Zamzam water.", img: "/images/zamzam.jpg", btn: "Add to Cart" },
    { id: "iftar-makkah", name: "Iftar in Makkah", price: 40000, desc: "Sponsor Iftar dinner for fasting people in Makkah.", img: "/images/orphans.jpg", btn: "Add to Cart" }
  ];

  const recommended = [
    { id: 'ramadan-umrah', name: 'Ramadan Umrah', price: 85000, desc: 'Umrah in the blessed nights of Ramadan with premium arrangements.', img: '/images/hajj.jpg' },
    { id: 'family-umrah', name: 'Family Umrah', price: 120000, desc: 'Perfect package designed for families travelling together.', img: '/images/roza.jpg' },
    { id: 'hajj-premium', name: 'Hajj Badal Premium', price: 350000, desc: 'Premium Hajj Badal with VIP services and full documentation.', img: '/images/wheelchair.jpg' }
  ];

  // Donation campaigns (emoji ke bajaye SVG icon components)
  const donationCampaigns = [
    { name: 'Water Well', goal: 500000, raised: 340000, icon: DropletIcon },
    { name: 'Food Package', goal: 200000, raised: 150000, icon: BowlIcon },
    { name: 'Quran Distribution', goal: 100000, raised: 82000, icon: BookOpenIcon }
  ];

  // Notifications (emoji ke bajaye SVG icon components)
  const notifications = [
    { icon: CheckCircleIcon, title: 'Payment Successful', text: 'Your payment was confirmed successfully.', time: '2h ago' },
    { icon: PackageIcon, title: 'Booking Confirmed', text: 'A performer will be assigned to your booking shortly.', time: '1d ago' },
    { icon: ShieldIcon, title: 'Admin Verified Documents', text: 'Performer documents have been verified by admin.', time: '2d ago' },
    { icon: GiftIcon, title: 'New Package Available', text: 'Ramadan Umrah package is now open for booking.', time: '3d ago' }
  ];

  // Service Selection Modal: DB packages + other services
  const allBookableServices = [
    ...packages.map(p => ({ id: p._id, name: p.title, price: p.price, img: p.image, desc: p.desc })),
    ...otherServices.map(s => ({ id: s.id, name: s.name, price: s.price, img: s.img, desc: s.desc }))
  ];

  // Sidebar items (SVG icon components)
  const sidebarItems = [
    { icon: HomeIcon, label: 'Dashboard', action: 'top', active: true },
    { icon: KaabaIcon, label: 'Services', action: 'top' },
    { icon: PackageIcon, label: 'My Orders', action: 'orders' },
    { icon: CartIcon, label: 'Cart', to: '/cart' },
    { icon: HeartIcon, label: 'Wishlist', to: '/wishlist' },
    { icon: CalendarIcon, label: 'My Bookings', action: 'soon' },
    { icon: GiftIcon, label: 'Donations', action: 'donations' },
    { icon: BellIcon, label: 'Notifications', action: 'notifications' },
    { icon: UserIcon, label: 'My Profile', action: 'soon' },
    { icon: SettingsIcon, label: 'Settings', action: 'soon' },
    { icon: HelpIcon, label: 'Help & Support', action: 'soon' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      <div className="flex">

        <aside className="hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 p-4 z-10 flex-shrink-0">
          <nav className="flex-1 space-y-1 py-4 overflow-y-auto">
            {sidebarItems.map(it => it.to ? (
              <Link key={it.label} to={it.to} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors font-semibold text-sm">
                <it.icon /> {it.label}
              </Link>
            ) : (
              <button key={it.label} onClick={() => handleNav(it.action)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${it.active ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-primary'}`}>
                <it.icon /> {it.label}
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm">
                <LogoutIcon /> Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">

          <header className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 flex justify-between items-center sticky top-16 z-10">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{getGreeting()}, {user?.firstName} {user?.lastName}!</h2>
              <p className="text-gray-400 text-xs">Manage your bookings and services here.</p>
            </div>
            <button onClick={handleBookClick} className="hidden md:flex bg-primary text-white font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all text-sm items-center gap-2">+ New Booking</button>
          </header>

          <div className="p-6 md:p-10">

            <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl aspect-[21/9]">
              <video className="absolute inset-0 w-full h-full object-cover" src="/videos/banner.mp4" autoPlay loop muted playsInline></video>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent flex items-center">
                <div className="p-8 md:p-14 max-w-xl">
                  <span className="inline-block bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest">LIMITED TIME OFFER</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: 'Amiri, serif' }}>Fulfill the Sacred Duty</h3>
                  <p className="text-white/80 text-sm mb-6 max-w-md">Perform Umrah on behalf of your deceased loved ones with complete transparency.</p>
                  <button onClick={handleBookClick} className="bg-accent text-white font-bold px-6 py-2.5 rounded-full hover:bg-white hover:text-primary transition-all duration-300 text-sm shadow-lg flex items-center gap-2">Book Now <span>→</span></button>
                </div>
              </div>
            </div>

            {/* ================= MY ACTIVE ORDER ================= */}
            <div className="mb-12">
              {activeOrder ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <PackageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">My Active Order</p>
                      <h3 className="text-xl font-extrabold text-gray-900">{activeOrder.service || activeOrder.serviceName || activeOrder.package || 'Badal Service'}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Booking ID: <span className="font-bold text-gray-600">#{activeOrder.orderCode || activeOrder._id}</span></p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${TRACK_STATUS_STYLES[activeOrder.status] || 'bg-gray-100 text-gray-600'}`}>{activeOrder.status || '—'}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${TRACK_STATUS_STYLES[activeOrder.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {PAY_LABEL[activeOrder.paymentStatus] || activeOrder.paymentStatus || '—'}
                    </span>
                    <button
                      onClick={() => { setPresetOrder(activeOrder); setTrackOpen(true); }}
                      className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all text-sm"
                    >
                      Track My Order →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                    <KaabaIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">No Active Booking</p>
                    <p className="text-xs text-gray-400 mt-0.5">Book a Badal service and track it live right here.</p>
                  </div>
                  <button onClick={handleBookClick} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90">+ New Booking</button>
                </div>
              )}
            </div>
            {/* ================= MY ACTIVE ORDER END ================= */}

            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Umrah & Hajj Badal Packages</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {packages.map(pkg => {
                const itemData = { id: pkg._id, name: pkg.title, price: pkg.price, img: pkg.image, desc: pkg.desc };
                return (
                  <div key={pkg._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white leading-tight" style={{ fontFamily: 'Amiri, serif' }}>{pkg.title}</h4>
                      <button onClick={() => toggleWishlist(itemData)} className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors">
                        {wishlist.find(w => w.id === itemData.id) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-700" />}
                      </button>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xl font-extrabold text-primary mb-2">PKR {pkg.price.toLocaleString()}</span>
                      <p className="text-gray-500 text-sm mb-5 flex-1">{pkg.desc}</p>
                      <Link to={`/service/${pkg._id}`} className="w-full bg-gray-50 text-primary font-bold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 text-sm flex items-center justify-center gap-1">View Details <span>→</span></Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Other Services & Donations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {otherServices.map(svc => {
                const itemData = { id: svc.id, name: svc.name, price: svc.price, img: svc.img, desc: svc.desc };
                return (
                  <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <img src={svc.img} alt={svc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>{svc.name}</h4>
                      <button onClick={() => toggleWishlist(itemData)} className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors">
                        {wishlist.find(w => w.id === itemData.id) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-700" />}
                      </button>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xl font-extrabold text-primary mb-2">PKR {svc.price.toLocaleString()}</span>
                      <p className="text-gray-500 text-sm mb-5 flex-1">{svc.desc}</p>
                      {svc.btn === "Add to Cart" ? (
                        <button onClick={() => handleAddToCart(itemData)} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-300 text-sm text-center flex items-center justify-center gap-1.5">{svc.btn} <CartIcon className="w-4 h-4" /></button>
                      ) : (
                        <Link to={`/service/${svc.id}`} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-300 text-sm text-center flex items-center justify-center gap-1.5">{svc.btn} <CartIcon className="w-4 h-4" /></Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ================= RECOMMENDED FOR YOU ================= */}
            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Recommended For You</h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5"><StarIcon className="w-3.5 h-3.5" /> Suggestions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
              {recommended.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img src={r.img} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <span className="absolute top-3 left-3 bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full">RECOMMENDED</span>
                    <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>{r.name}</h4>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xl font-extrabold text-primary mb-2">PKR {r.price.toLocaleString()}</span>
                    <p className="text-gray-500 text-sm mb-5 flex-1">{r.desc}</p>
                    <button onClick={handleBookClick} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-300 text-sm">Book Now</button>
                  </div>
                </div>
              ))}
            </div>
            {/* ================= RECOMMENDED END ================= */}

            {/* ================= DONATION PROGRESS ================= */}
            <div className="mb-6 flex justify-between items-end" id="donations">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Donation Progress</h3>
              <button onClick={() => showToast('Donation history is coming soon!')} className="text-sm font-bold text-primary hover:underline">View Donation History →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
              {donationCampaigns.map(d => {
                const pct = Math.min(100, Math.round((d.raised / d.goal) * 100));
                return (
                  <div key={d.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <d.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{d.name}</p>
                        <p className="text-xs text-gray-400">Goal PKR {d.goal.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary rounded-full" style={{ width: pct + '%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-primary">{pct}% Funded</span>
                      <span className="text-gray-500 font-semibold">PKR {d.raised.toLocaleString()} raised</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* ================= DONATION PROGRESS END ================= */}

            {/* ================= NOTIFICATIONS ================= */}
            <div className="mb-6 flex justify-between items-end" id="notifications">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Notifications</h3>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 mb-16">
              {notifications.map((n, i) => (
                <div key={i} className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <n.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{n.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold flex-shrink-0">{n.time}</span>
                </div>
              ))}
            </div>
            {/* ================= NOTIFICATIONS END ================= */}

            {/* ================= CERTIFICATES (COMING SOON) ================= */}
            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Certificates & Documents</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-3 py-1 rounded-full">Coming Soon</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['Download Completion Certificate', 'Download Receipt', 'View Proof'].map(label => (
                  <button key={label} disabled className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-300 font-bold text-sm cursor-not-allowed">{label}</button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">These will be available after your booking is completed.</p>
            </div>
            {/* ================= CERTIFICATES END ================= */}

          </div>
        </main>
      </div>

      {/* ================= SERVICE SELECTION MODAL (New Booking) ================= */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowServiceModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Select a Service to Book</h3>
                <p className="text-xs text-gray-400 mt-0.5">Choose any service below — its booking form will open.</p>
              </div>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allBookableServices.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setShowServiceModal(false); navigate(`/checkout/${item.id}`); }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <img src={item.img} alt={item.name} className="w-16 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-primary font-extrabold mt-0.5">PKR {item.price.toLocaleString()}</p>
                  </div>
                  <span className="text-primary text-xl opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SIDE BUTTONS ================= */}

      {/* Track My Order — right side vertical button */}
      <button
        onClick={() => { setPresetOrder(null); setTrackOpen(true); }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-white px-2.5 py-6 rounded-l-2xl shadow-xl font-bold text-xs tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        style={{ writingMode: 'vertical-rl' }}
      >
        Track My Order <MapPinIcon className="w-3.5 h-3.5" />
      </button>

      {/* New Booking — mobile floating button */}
      <button
        onClick={handleBookClick}
        className="md:hidden fixed bottom-5 right-5 z-40 bg-accent text-white w-14 h-14 rounded-full shadow-2xl text-2xl font-bold flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="New Booking"
      >
        +
      </button>

      {/* Track My Order drawer */}
      <TrackDrawer open={trackOpen} onClose={() => setTrackOpen(false)} presetOrder={presetOrder} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-2xl">
          {toast}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
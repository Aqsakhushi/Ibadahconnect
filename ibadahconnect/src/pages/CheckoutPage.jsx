import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaLock, FaKaaba, FaPlus, FaMinus, FaTrash, FaCheckCircle,
  FaShieldAlt, FaUniversity, FaHeadset, FaShoppingBag,
  FaMoneyCheckAlt, FaWhatsapp,
} from 'react-icons/fa';

/* ========================= Constants ========================= */

const HADIYAH_OPTIONS = [
  { id: 'none', label: 'No Hadiyah', amount: 0 },
  { id: 'goat', label: 'Hadiyah — Goat (Bakra)', amount: 45000 },
  { id: 'sheep', label: 'Hadiyah — Sheep (Dumba)', amount: 38000 },
  { id: 'camel', label: 'Hadiyah — Camel Share (1/7)', amount: 65000 },
];

const STATIC_SERVICES = {
  umrah: { desc: 'Umrah performed on your behalf in Makkah by a verified performer.' },
  hajj: { desc: 'Hajj performed on your behalf by a verified performer.' },
  aqiqah: { desc: 'Aqiqah performed and meat distributed among the needy.' },
  sadaqah: { desc: 'Sadaqah distributed on your behalf to deserving people.' },
  nazar: { desc: 'Nazar / Mannat fulfilled on your behalf.' },
  qurban: { desc: 'Qurbani performed and meat distributed.' },
};

const BANK_DETAILS = {
  bankName: 'Meezan Bank',
  accountTitle: 'IbadahConnect',
  accountNumber: '0123 0101 2345678',
  iban: 'PK00 MEZN 0000 0000 0000 0000',
};

const CONTACT = { phone: '+92 300 1234567', email: 'info@ibadahconnect.com' };

const SUMMARY_FEATURES = [
  'Verified & vetted performers',
  'Shariah-compliant proxy Ibadah',
  'Daily progress updates with proof',
  'Official completion certificate',
];

const TRUST_ITEMS = [
  { icon: FaShieldAlt, title: 'Secure & Private', text: 'Your personal details stay safe and are never shared with anyone.' },
  { icon: FaUniversity, title: 'Bank Transfer', text: 'Pay securely via direct bank transfer after placing your order.' },
  { icon: FaHeadset, title: 'Dedicated Support', text: 'Our team guides and updates you at every step of your Ibadah.' },
];

/* ========================= Helpers ========================= */

// Logged-in user — LoginPage 'user' key + auth-helpers 'ibadahUser' key, dono support
function getStoredUser() {
  const KEYS = ['user', 'ibadahUser', 'currentUser'];
  for (const key of KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.user) parsed = parsed.user;
      if (parsed && (parsed.email || parsed._id || parsed.id)) {
        return { ...parsed, id: parsed.id || parsed._id, role: parsed.role || 'Sponsor' };
      }
    } catch {
      /* ignore broken json */
    }
  }
  return null;
}

// Billing form — logged-in user k data se autofill
function buildBillingFromUser(u) {
  const first = (u && u.firstName) || '';
  const last = (u && u.lastName) || '';
  return {
    fullName: `${first} ${last}`.trim() || (u && u.name) || '',
    email: (u && u.email) || '',
    phone: (u && u.phone) || '',
    country: (u && u.country) || 'Pakistan',
    city: (u && u.city) || '',
    address: '',
    notes: '',
  };
}

function readCart() {
  try {
    const list = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const fmt = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-PK');

function serviceMeta(name) {
  const key = Object.keys(STATIC_SERVICES).find((k) => (name || '').toLowerCase().includes(k));
  return key ? STATIC_SERVICES[key] : null;
}

/* ========================= Page ========================= */

export default function CheckoutPage() {
  const [user] = useState(getStoredUser);
  const [cart, setCart] = useState(readCart);
  const [billing, setBilling] = useState(() => buildBillingFromUser(getStoredUser()));
  const [hadiyahId, setHadiyahId] = useState('none');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + Number(i.price || 0) * Math.max(1, Number(i.qty || 1)), 0),
    [cart]
  );
  const hadiyah = HADIYAH_OPTIONS.find((h) => h.id === hadiyahId) || HADIYAH_OPTIONS[0];
  const total = subtotal + hadiyah.amount;

  const writeCart = (list) => {
    setCart(list);
    localStorage.setItem('cart', JSON.stringify(list));
    window.dispatchEvent(new Event('cartChanged'));
  };

  const updateQty = (id, delta) => {
    writeCart(
      cart.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Number(i.qty || 1) + delta) } : i))
    );
  };

  const removeItem = (id) => writeCart(cart.filter((i) => i.id !== id));

  const onBillingChange = (e) => {
    const { name, value } = e.target;
    setBilling((b) => ({ ...b, [name]: value }));
  };

  // Backend contract: fullName + phone + address required (orders.js)
  const validate = () => {
    if (!billing.fullName.trim()) return 'Please enter your full name.';
    if (!billing.email.trim()) return 'Please enter your email address.';
    if (!/^\S+@\S+\.\S+$/.test(billing.email.trim())) return 'Please enter a valid email address.';
    if (!billing.phone.trim()) return 'Please enter your phone number.';
    if (!billing.address.trim()) return 'Please enter your address.';
    return '';
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setOrderError('');
    const invalid = validate();
    if (invalid) {
      setOrderError(invalid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPlacing(true);

    // Order snapshot — cart clear karne se PEHLE capture (receipt k liye)
    const snapshot = {
      orderNumber: `IC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      placedAt: new Date().toLocaleString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
      items: cart.map((i) => ({ ...i })),
      subtotal,
      hadiyah,
      total,
      billing: { ...billing },
      paymentMethod: 'Bank Transfer',
    };

    try {
      /* EXACT backend contract — backend/routes/orders.js POST / */
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, // backend body se userId mangta hai
          billing: {
            fullName: billing.fullName,
            phone: billing.phone,
            address: billing.address,
            city: billing.city,
            country: billing.country,
            notes: billing.notes,
          },
          items: cart.map((i) => ({
            packageId: i.id, // Package ObjectId YA static slug (hajj-badal etc.)
            qty: Math.max(1, Number(i.qty || 1)),
          })),
          hadiyah: hadiyah.amount, // backend NUMBER expect karta hai
          paymentMethod: 'Bank Transfer',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Order could not be placed. Please try again.');
      // Backend orderCodes[] (array) aur total return karta hai
      if (Array.isArray(data.orderCodes) && data.orderCodes.length) {
        snapshot.orderNumber = data.orderCodes.join(', ');
      }
      if (typeof data.total === 'number' && data.total > 0) snapshot.total = data.total;
    } catch (err) {
      setOrderError(
        err.message === 'Failed to fetch'
          ? 'Cannot reach server. Is the backend running?'
          : err.message || 'Something went wrong. Please try again.'
      );
      setPlacing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Order placed — cart clear karo, receipt dikhao
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartChanged'));
    setCart([]);
    setReceipt(snapshot);
    setPlacing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------- LOGIN GATE: pehle login, phir checkout ---------- */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center px-4 py-16 font-outfit">
        <div className="bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/30 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1B5E20]/10 flex items-center justify-center mb-5">
            <FaLock className="text-2xl text-[#1B5E20]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F3D14]" style={{ fontFamily: "'Cinzel', serif" }}>
            Login Required
          </h1>
          <p className="text-gray-600 mt-3">
            Please login to your Sponsor account to continue with checkout and payment.
          </p>
          {cart.length > 0 && (
            <div className="mt-4 bg-[#FAF6EE] border border-[#D4AF37]/40 rounded-xl px-4 py-3 text-sm text-[#8a6d1a] flex items-start justify-center gap-2 text-left">
              <FaShoppingBag className="flex-shrink-0 mt-0.5" />
              <span>
                Good news — your cart ({cart.length} item{cart.length > 1 ? 's' : ''}) is saved and
                will be waiting for you after login.
              </span>
            </div>
          )}
          <Link
            to="/login?redirect=/checkout"
            className="mt-6 inline-block bg-[#1B5E20] text-white font-bold px-8 py-3 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#0F3D14] transition-all"
          >
            Go to Login
          </Link>
          <div className="mt-4">
            <Link to="/" className="text-sm text-[#8a6d1a] font-medium hover:underline">
              Continue browsing services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- ORDER RECEIPT ---------- */
  if (receipt) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] px-4 py-12 font-outfit">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden">
          <div className="bg-[#0B2E10] px-8 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1B5E20] flex items-center justify-center ring-2 ring-[#D4AF37]/60">
              <FaCheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              JazakAllah Khair!
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Your order has been received. Complete the bank transfer below to confirm your booking.
            </p>
          </div>

          <div className="p-8">
            {/* Order meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#FAF6EE] border border-[#D4AF37]/30 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Order Number</p>
                <p className="font-bold text-[#0F3D14] mt-1 text-sm break-all">{receipt.orderNumber}</p>
              </div>
              <div className="bg-[#FAF6EE] border border-[#D4AF37]/30 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Date</p>
                <p className="font-bold text-[#0F3D14] mt-1 text-sm">{receipt.placedAt}</p>
              </div>
              <div className="bg-[#FAF6EE] border border-[#D4AF37]/30 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Payment</p>
                <p className="font-bold text-[#0F3D14] mt-1 text-sm">{receipt.paymentMethod}</p>
              </div>
              <div className="bg-[#FAF6EE] border border-[#D4AF37]/30 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total</p>
                <p className="font-bold text-[#8a6d1a] mt-1 text-sm">{fmt(receipt.total)}</p>
              </div>
            </div>

            {/* Items */}
            <h2 className="font-bold text-[#0F3D14] mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
              Order Items
            </h2>
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
              {receipt.items.map((item) => {
                const q = Math.max(1, Number(item.qty || 1));
                return (
                  <div key={item.id} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-gray-700 font-medium">{item.name} × {q}</span>
                    <span className="font-semibold text-gray-800">{fmt(Number(item.price || 0) * q)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between px-4 py-3 text-sm bg-gray-50">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{fmt(receipt.subtotal)}</span>
              </div>
              {receipt.hadiyah && receipt.hadiyah.amount > 0 && (
                <div className="flex justify-between px-4 py-3 text-sm bg-gray-50">
                  <span className="text-gray-600">{receipt.hadiyah.label}</span>
                  <span className="font-semibold">{fmt(receipt.hadiyah.amount)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3">
                <span className="font-bold text-[#0F3D14]">Total</span>
                <span className="font-extrabold text-[#8a6d1a]">{fmt(receipt.total)}</span>
              </div>
            </div>

            {/* Bank transfer box */}
            <div className="bg-[#1B5E20]/5 border-2 border-[#1B5E20]/30 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-[#0F3D14] flex items-center gap-2 mb-3">
                <FaUniversity className="text-[#8a6d1a]" /> Bank Transfer Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase">Bank</p>
                  <p className="font-semibold text-gray-800">{BANK_DETAILS.bankName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase">Account Title</p>
                  <p className="font-semibold text-gray-800">{BANK_DETAILS.accountTitle}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase">Account Number</p>
                  <p className="font-semibold text-gray-800">{BANK_DETAILS.accountNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase">IBAN</p>
                  <p className="font-semibold text-gray-800 break-all">{BANK_DETAILS.iban}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 flex items-center gap-2 flex-wrap">
                <FaWhatsapp className="text-[#1B5E20]" />
                After transferring, share your payment receipt on WhatsApp:
                <span className="font-bold text-[#0F3D14]">{CONTACT.phone}</span>
              </p>
            </div>

            <p className="text-sm text-gray-500 text-center mb-6">
              Questions? Email us at <span className="font-semibold text-[#8a6d1a]">{CONTACT.email}</span> — a
              confirmation update will also be sent to <span className="font-semibold">{receipt.billing.email}</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="text-center bg-[#1B5E20] text-white font-bold px-8 py-3 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#0F3D14] transition-all"
              >
                Back to Home
              </Link>
              <Link
                to="/dashboard"
                className="text-center border-2 border-[#1B5E20] text-[#1B5E20] font-bold px-8 py-3 rounded-full hover:bg-[#1B5E20] hover:text-white transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- EMPTY CART ---------- */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center px-4 py-16 font-outfit">
        <div className="bg-white rounded-3xl shadow-xl border border-[#D4AF37]/30 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#1B5E20]/10 flex items-center justify-center mb-5">
            <FaShoppingBag className="text-2xl text-[#1B5E20]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F3D14]" style={{ fontFamily: "'Cinzel', serif" }}>
            Your Cart is Empty
          </h1>
          <p className="text-gray-600 mt-2">Add a service to the cart to continue with checkout.</p>
          <Link
            to="/"
            className="mt-6 inline-block bg-[#1B5E20] text-white font-bold px-8 py-3 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#0F3D14] transition-all"
          >
            Browse Services
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- MAIN CHECKOUT ---------- */
  return (
    <div className="min-h-screen bg-[#FAF6EE] font-outfit">
      {/* Header strip */}
      <div className="bg-[#0B2E10] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="text-xs text-[#D4AF37] font-semibold tracking-widest uppercase mb-2">
            Home / Checkout
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold" style={{ fontFamily: "'Cinzel', serif" }}>
            Checkout
          </h1>
          <p className="text-white/70 mt-2 text-sm flex items-center gap-2">
            <FaLock className="text-[#D4AF37]" /> Secure checkout — complete your booking in a few steps.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* ---------- LEFT COLUMN ---------- */}
        <div className="space-y-8">
          {orderError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {orderError}
            </div>
          )}

          {/* Cart items */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#D4AF37]/25 p-6">
            <h2 className="text-xl font-bold text-[#0F3D14] mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
              Your Order
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Review the services in your cart before placing the order.
            </p>
            <div className="divide-y divide-gray-100">
              {cart.map((item) => {
                const meta = serviceMeta(item.name);
                const qty = Math.max(1, Number(item.qty || 1));
                const price = Number(item.price || 0);
                return (
                  <div key={item.id} className="py-4 flex gap-4 items-start">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#0F3D14] to-[#1B5E20] flex items-center justify-center">
                        <FaKaaba className="text-[#D4AF37] text-2xl" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.desc || (meta && meta.desc) || 'Proxy Ibadah service'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="px-3 text-sm font-bold text-gray-800">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <FaTrash size={12} /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-[#0F3D14]">{fmt(price * qty)}</div>
                      {qty > 1 && <div className="text-xs text-gray-400 mt-0.5">{fmt(price)} each</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Billing form — autofilled from account */}
          <form
            id="checkout-form"
            onSubmit={placeOrder}
            className="bg-white rounded-2xl shadow-sm border border-[#D4AF37]/25 p-6"
          >
            <h2 className="text-xl font-bold text-[#0F3D14] mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
              Billing Details
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Details from your account are filled in — you can edit them if needed.
            </p>
            {user && (
              <div className="mb-5 flex items-center gap-3 bg-[#FAF6EE] border border-[#D4AF37]/40 rounded-xl px-4 py-3">
                <FaCheckCircle className="text-[#1B5E20] flex-shrink-0" />
                <p className="text-sm text-[#8a6d1a]">
                  Logged in as <span className="font-bold">{billing.fullName || user.email}</span> ({user.email})
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  name="fullName"
                  value={billing.fullName}
                  onChange={onBillingChange}
                  placeholder="e.g. Ahmed Ali"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={billing.email}
                  onChange={onBillingChange}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                <input
                  name="phone"
                  value={billing.phone}
                  onChange={onBillingChange}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                <input
                  name="country"
                  value={billing.country}
                  onChange={onBillingChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <input
                  name="city"
                  value={billing.city}
                  onChange={onBillingChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                <input
                  name="address"
                  value={billing.address}
                  onChange={onBillingChange}
                  placeholder="House #, Street, Area"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Order Notes (optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  value={billing.notes}
                  onChange={onBillingChange}
                  placeholder="Special du'as, name of the person for whom the Ibadah is performed, etc."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
                />
              </div>
            </div>
          </form>

          {/* Payment method */}
          <section className="bg-white rounded-2xl shadow-sm border border-[#D4AF37]/25 p-6">
            <h2 className="text-xl font-bold text-[#0F3D14] mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
              Payment Method
            </h2>
            <div className="border-2 border-[#1B5E20]/40 bg-[#1B5E20]/5 rounded-xl p-4 flex gap-3">
              <FaMoneyCheckAlt className="text-[#1B5E20] text-xl mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold text-[#0F3D14]">Bank Transfer — Direct</p>
                <p className="text-sm text-gray-600 mt-1">
                  Place your order, then transfer the total amount to the account below and share the
                  receipt on WhatsApp.
                </p>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-700"><span className="font-semibold">Bank:</span> {BANK_DETAILS.bankName}</p>
                  <p className="text-gray-700"><span className="font-semibold">Title:</span> {BANK_DETAILS.accountTitle}</p>
                  <p className="text-gray-700"><span className="font-semibold">A/C No:</span> {BANK_DETAILS.accountNumber}</p>
                  <p className="text-gray-700 break-all"><span className="font-semibold">IBAN:</span> {BANK_DETAILS.iban}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Trust strip */}
          <section className="grid sm:grid-cols-3 gap-4">
            {TRUST_ITEMS.map((t) => (
              <div key={t.title} className="bg-white rounded-2xl border border-[#D4AF37]/25 p-5">
                <t.icon className="text-[#1B5E20] text-xl mb-2" />
                <p className="font-bold text-[#0F3D14] text-sm">{t.title}</p>
                <p className="text-xs text-gray-500 mt-1">{t.text}</p>
              </div>
            ))}
          </section>
        </div>

        {/* ---------- RIGHT: STICKY SUMMARY ---------- */}
        <aside className="lg:sticky lg:top-8 bg-white rounded-2xl shadow-lg border border-[#D4AF37]/30 p-6">
          <h2 className="text-xl font-bold text-[#0F3D14]" style={{ fontFamily: "'Cinzel', serif" }}>
            Order Summary
          </h2>
          <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
            {cart.map((item) => {
              const q = Math.max(1, Number(item.qty || 1));
              return (
                <div key={item.id} className="flex justify-between text-sm gap-2">
                  <span className="text-gray-600 truncate">{item.name} × {q}</span>
                  <span className="font-semibold text-gray-800 flex-shrink-0">
                    {fmt(Number(item.price || 0) * q)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-100 my-4" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{fmt(subtotal)}</span>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hadiyah (optional gift)</label>
            <select
              value={hadiyahId}
              onChange={(e) => setHadiyahId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent bg-white"
            >
              {HADIYAH_OPTIONS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}{h.amount > 0 ? ` — ${fmt(h.amount)}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Hadiyah</span>
            <span className="font-semibold">{hadiyah.amount > 0 ? fmt(hadiyah.amount) : '—'}</span>
          </div>
          <div className="border-t border-gray-100 my-4" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#0F3D14]">Total</span>
            <span className="text-2xl font-extrabold text-[#8a6d1a]">{fmt(total)}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={placing}
            className="mt-5 w-full bg-[#1B5E20] text-white py-3.5 rounded-full font-bold ring-1 ring-[#D4AF37]/60 hover:bg-[#0F3D14] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {placing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Placing Order…
              </>
            ) : (
              <>
                Place Order <FaLock size={12} />
              </>
            )}
          </button>
          <div className="mt-5 border-t border-[#D4AF37]/30 pt-4">
            {SUMMARY_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-gray-600 py-1">
                <FaCheckCircle className="text-[#1B5E20] mt-0.5 flex-shrink-0" size={14} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
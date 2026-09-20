import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { useCart } from '../context/CartContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  FaMosque, FaShoppingCart, FaTrash, FaMoneyBillWave, FaGift, FaCheckCircle,
  FaArrowRight, FaUser, FaPhone, FaMapMarkerAlt, FaGlobe, FaCity, FaLock,
  FaMobileAlt, FaUniversity, FaUpload, FaCopy, FaSearch, FaSpinner, FaTimes,
} from 'react-icons/fa';

const HADIYAH_OPTIONS = [50, 100, 500, 1000];

/* Static services (DB m nahi hain, /checkout/:id direct inpar bhi kaam kare) */
const STATIC_SERVICES = {
  'hajj-badal': { id: 'hajj-badal', name: 'Hajj Badal', price: 300000, img: '/images/hajj.jpg', desc: 'Fulfill the ultimate pillar of Islam on behalf of your deceased loved ones.' },
  'wheelchair': { id: 'wheelchair', name: 'Wheelchair Donation', price: 25000, img: '/images/wheelchair.jpg', desc: 'Donate a wheelchair to Masjid al-Haram.' },
  'roza-kushai': { id: 'roza-kushai', name: 'Roza Kushai (Iftar)', price: 5000, img: '/images/roza.jpg', desc: 'Arrange Iftar for a fasting person.' },
  'tasbeeh': { id: 'tasbeeh', name: 'Tasbeeh Distribution', price: 400, img: '/images/tasbeeh.jpg', desc: 'Distribute prayer beads to worshippers in Haram.' },
  'zamzam': { id: 'zamzam', name: 'Ab-e-Zamzam Delivery', price: 8000, img: '/images/zamzam.jpg', desc: 'Arrange pure Zamzam water to be distributed.' },
  'iftar-makkah': { id: 'iftar-makkah', name: 'Iftar in Makkah', price: 40000, img: '/images/orphans.jpg', desc: 'Sponsor Iftar dinner for fasting people in Makkah.' },
};

/* ⚠️ APNA REAL BANK ACCOUNT YAHAN DAALO */
const BANK_DETAILS = {
  bankName: 'Meezan Bank Limited',
  accountTitle: 'IbadahConnect (Pvt) Ltd',
  accountNumber: '0123-0102845571',
  iban: 'PK36MEZN0001230102845571',
};

const copyText = (t) => {
  if (navigator.clipboard) navigator.clipboard.writeText(t);
  toast.success('Copied to clipboard');
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { cartItems, addToCart, removeFromCart, cartTotal, clearCart } = useCart();
  const current = getCurrentUser();

  const [step, setStep] = useState(1);
  const [loadingService, setLoadingService] = useState(false);
  const [billing, setBilling] = useState({
    fullName: current?.firstName ? `${current.firstName} ${current.lastName || ''}`.trim() : '',
    phone: current?.phone || '',
    country: 'Pakistan',
    city: '',
    address: '',
    notes: '',
  });
  const [hadiyah, setHadiyah] = useState(0);
  const [payMethod, setPayMethod] = useState('jazzcash');
  const [jcPhone, setJcPhone] = useState(current?.phone || '');
  const [jcCnic, setJcCnic] = useState('');
  const [bankSender, setBankSender] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [procStep, setProcStep] = useState(0);
  const [success, setSuccess] = useState(null);

  const grandTotal = cartTotal + hadiyah;

  /* ============ DIRECT BOOKING /checkout/:id ============ */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      if (cartItems.length > 0) return;
      try {
        setLoadingService(true);
        let item = null;
        try {
          const res = await API.get('/packages/all');
          const found = (res.data || []).find((p) => p._id === id);
          if (found) {
            item = { _id: found._id, title: found.title, price: found.price, image: found.image, desc: found.desc, category: found.category || 'Umrah Badal' };
          }
        } catch (e) { console.error(e); }
        if (!item && STATIC_SERVICES[id]) {
          const st = STATIC_SERVICES[id];
          item = { _id: st.id, title: st.name, price: st.price, image: st.img, desc: st.desc, category: 'Donation' };
        }
        if (!mounted) return;
        if (item) addToCart(item);
        else { toast.error('Service not found.'); navigate('/dashboard'); }
      } finally {
        if (mounted) setLoadingService(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  /* ============ LOGIN GUARD ============ */
  if (!current) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-5 text-2xl"><FaUser /></div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Login Required</h1>
          <p className="text-sm text-gray-500 mb-6">Please login to your Sponsor account to continue with checkout and payment.</p>
          <button onClick={() => navigate('/dashboard')} className="w-full bg-emerald-800 text-white py-3 rounded-xl font-bold hover:bg-emerald-900 transition">Go to Login</button>
        </div>
      </div>
    );
  }

  /* ============ LOADING ============ */
  if (loadingService && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <FaShoppingCart className="text-5xl text-emerald-700 mx-auto mb-4 animate-pulse" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Loading service...</h1>
          <p className="text-gray-500">Please wait while we prepare your checkout.</p>
        </div>
      </div>
    );
  }

  /* ============ EMPTY CART ============ */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Select a service from the list below to book it.</p>
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-900 transition">
            <FaMosque /> Browse Services
          </button>
        </div>
      </div>
    );
  }

  /* ============ SUCCESS SCREEN ============ */
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 px-8 py-10 text-center text-white">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4 ring-8 ring-white/5">
                <FaCheckCircle className="text-5xl text-amber-300" />
              </div>
              <h1 className="text-2xl font-extrabold mb-1">{success.status === 'Paid' ? 'Payment Successful!' : 'Order Received!'}</h1>
              <p className="text-emerald-100 text-sm">
                {success.method === 'JazzCash'
                  ? 'Your payment was confirmed via JazzCash.'
                  : 'Your bank transfer receipt is under review. You will be notified once verified.'}
              </p>
            </div>
            <div className="px-8 py-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Your Order ID{success.orders.length > 1 ? 's' : ''} — save it for tracking
              </p>
              <div className="space-y-2 mb-6">
                {success.orders.map((o) => (
                  <div key={o.orderCode || o._id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <span className="font-mono font-bold text-emerald-900">{o.orderCode}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Rs {(o.price || 0).toLocaleString()}</span>
                      <button onClick={() => copyText(o.orderCode)} className="text-gray-400 hover:text-emerald-700"><FaCopy /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Amount Paid</p>
                  <p className="font-extrabold text-gray-900">Rs {(success.total || 0).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Payment Ref</p>
                  <p className="font-bold text-gray-900 font-mono text-xs truncate">{success.txnRef || '—'}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate(`/track/${success.orders[0]?.orderCode}`)} className="flex-1 bg-emerald-800 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-900 transition inline-flex items-center justify-center gap-2">
                  <FaSearch /> Track My Order
                </button>
                <button onClick={() => navigate('/dashboard')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-bold text-gray-700 hover:bg-gray-50">Back to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============ HANDLERS ============ */
  const handleBillingChange = (e) => setBilling({ ...billing, [e.target.name]: e.target.value });

  const handleContinue = () => {
    if (!billing.fullName.trim() || !billing.phone.trim() || !billing.address.trim()) {
      toast.error('Please fill in all required billing fields.');
      return;
    }
    setStep(2);
  };

  const handleReceipt = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Receipt must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setReceipt(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) { toast.error('Your cart is empty.'); return; }

    if (payMethod === 'jazzcash') {
      const p = String(jcPhone || '').replace(/[\s-]/g, '');
      if (!/^03\d{9}$/.test(p)) { toast.error('Enter a valid JazzCash number (03XXXXXXXXX).'); return; }
      if (!/^\d{6}$/.test(String(jcCnic || ''))) { toast.error('Enter the last 6 digits of your CNIC.'); return; }
    } else if (!receipt) {
      toast.error('Please upload your bank transfer receipt screenshot.');
      return;
    }

    setPlacing(true);
    try {
      const res = await API.post('/orders', {
        userId: current?.id || current?._id,
        items: cartItems.map((ci) => ({ packageId: ci.id || ci._id, qty: ci.qty || 1 })),
        billing,
        hadiyah,
        total: grandTotal,
        paymentMethod: payMethod === 'jazzcash' ? 'JazzCash' : 'Bank Transfer',
      });

      const created = res.data.orders || [];
      const codes = created.map((o) => o.orderCode).filter(Boolean);
      const total = res.data.total || grandTotal;

      if (payMethod === 'jazzcash') {
        setProcessing(true);
        setProcStep(0);
        const t1 = setTimeout(() => setProcStep(1), 1000);
        const t2 = setTimeout(() => setProcStep(2), 2100);
        try {
          const payRes = await API.post('/payments/jazzcash/pay', { orderCodes: codes, amount: total, phone: jcPhone, cnic: jcCnic });
          await new Promise((r) => setTimeout(r, 3000));
          clearCart();
          setSuccess({ orders: created, total, txnRef: payRes.data?.txnRef, method: 'JazzCash', status: 'Paid' });
        } finally {
          clearTimeout(t1); clearTimeout(t2); setProcessing(false);
        }
      } else {
        const payRes = await API.post('/payments/bank/submit', { orderCodes: codes, senderName: bankSender || billing.fullName, receiptImage: receipt });
        clearCart();
        setSuccess({ orders: created, total, txnRef: payRes.data?.txnRef, method: 'Bank Transfer', status: 'Under Review' });
      }
    } catch (e) {
      console.error('Payment error:', e.response?.data || e.message);
      toast.error(e.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  /* ============ MAIN CHECKOUT ============ */
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* JazzCash processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl mb-4"><FaMobileAlt /></div>
            <h3 className="font-extrabold text-gray-900 mb-1">JazzCash Secure Payment</h3>
            <p className="text-[11px] text-gray-400 mb-6">Do not refresh or press back while processing</p>
            <div className="space-y-3 text-left mb-6">
              {['Connecting to JazzCash gateway', 'Authorizing transaction', 'Confirming payment'].map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  {procStep > i ? <FaCheckCircle className="text-emerald-600" /> : procStep === i ? <FaSpinner className="text-emerald-600 animate-spin" /> : <span className="w-4 h-4 rounded-full border-2 border-gray-200" />}
                  <span className={`text-sm ${procStep >= i ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-700" style={{ width: `${(procStep + 1) * 33}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
          {['Billing details', 'Order review', 'Payment'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? 'bg-emerald-600 text-white' : step === i + 1 ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i + 1 ? <FaCheckCircle /> : i + 1}
              </span>
              <span className={`text-sm font-medium ${step >= i + 1 ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
              {i < 2 && <span className="text-gray-300 mx-2">→</span>}
            </div>
          ))}
        </div>

        {/* STEP 1 — BILLING */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaUser className="text-emerald-700" /> Billing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="fullName" value={billing.fullName} onChange={handleBillingChange} placeholder="Your full name" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaPhone className="text-gray-400" /> Phone *</label>
                <input type="tel" name="phone" value={billing.phone} onChange={handleBillingChange} placeholder="+92 300 1234567" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaGlobe className="text-gray-400" /> Country</label>
                <input type="text" name="country" value={billing.country} onChange={handleBillingChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaCity className="text-gray-400" /> City</label>
                <input type="text" name="city" value={billing.city} onChange={handleBillingChange} placeholder="Lahore" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FaMapMarkerAlt className="text-gray-400" /> Address *</label>
                <input type="text" name="address" value={billing.address} onChange={handleBillingChange} placeholder="Street, city" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600" />
              </div>
            </div>

            <h3 className="text-md font-bold mt-6 mb-3 flex items-center gap-2"><FaGift className="text-emerald-700" /> Hadiyah / Gift (optional)</h3>
            <div className="flex flex-wrap gap-2">
              {HADIYAH_OPTIONS.map((amount) => (
                <button key={amount} type="button" onClick={() => setHadiyah(hadiyah === amount ? 0 : amount)}
                  className={`px-4 py-2 rounded-lg border font-medium text-sm ${hadiyah === amount ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-600'}`}>
                  Rs {amount.toLocaleString()}
                </button>
              ))}
              <button type="button" onClick={() => setHadiyah(0)}
                className={`px-4 py-2 rounded-lg border font-medium text-sm ${hadiyah === 0 ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-600'}`}>
                No Thanks!
              </button>
            </div>

            <button type="button" onClick={handleContinue} className="mt-6 inline-flex items-center gap-2 bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-900 transition">
              Continue <FaArrowRight />
            </button>
          </div>
        )}

        {/* STEP 2 — REVIEW */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Order Review</h2>
            {cartItems.map((item) => (
              <div key={item._id || item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-semibold text-gray-800">{item.title || item.name}</p>
                  <p className="text-sm text-gray-500">{item.category || 'Service'}{(item.qty || 1) > 1 ? ` · Qty ${item.qty}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-800">Rs {((item.price || 0) * (item.qty || 1)).toLocaleString()}</p>
                  <button type="button" onClick={() => removeFromCart(item._id || item.id)} className="text-red-500 text-xs hover:underline flex items-center gap-1">
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">Rs {cartTotal.toLocaleString()}</span>
              </div>
              {hadiyah > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hadiyah / Gift</span>
                  <span className="font-semibold">Rs {hadiyah.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2">
                <span>Total</span>
                <span>Rs {grandTotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50">Back</button>
              <button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-2 bg-emerald-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-900 transition">
                Continue to Payment <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — PAYMENT */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FaLock className="text-emerald-700" /> Payment Method</h2>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => setPayMethod('jazzcash')}
                className={`border-2 rounded-2xl p-4 text-left transition ${payMethod === 'jazzcash' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><FaMobileAlt /></span>
                  <div>
                    <p className="font-bold text-sm text-gray-900">JazzCash Mobile Account</p>
                    <p className="text-[11px] text-gray-500">Instant payment via your JazzCash number</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={() => setPayMethod('bank')}
                className={`border-2 rounded-2xl p-4 text-left transition ${payMethod === 'bank' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center"><FaUniversity /></span>
                  <div>
                    <p className="font-bold text-sm text-gray-900">Bank Transfer</p>
                    <p className="text-[11px] text-gray-500">Transfer & upload receipt for verification</p>
                  </div>
                </div>
              </button>
            </div>

            {payMethod === 'jazzcash' && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-2"><FaLock className="text-emerald-700" /> Your payment is processed on the secure JazzCash gateway.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
                    <input readOnly value={billing.fullName} className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JazzCash Number *</label>
                    <input type="tel" value={jcPhone} onChange={(e) => setJcPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Last 6 Digits *</label>
                    <input type="text" maxLength="6" value={jcCnic} onChange={(e) => setJcCnic(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 451278" className="w-full border rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-600" />
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Amount to Pay</p>
                    <p className="font-extrabold text-emerald-800 text-lg">Rs {grandTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {payMethod === 'bank' && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
                <p className="text-xs text-gray-600 mb-4">Transfer <b>Rs {grandTotal.toLocaleString()}</b> to the account below, then upload your receipt screenshot. Your order will be confirmed after verification.</p>
                <div className="space-y-2 mb-5">
                  {[['Bank', BANK_DETAILS.bankName], ['Account Title', BANK_DETAILS.accountTitle], ['Account Number', BANK_DETAILS.accountNumber], ['IBAN', BANK_DETAILS.iban]].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{val}</p>
                      </div>
                      <button type="button" onClick={() => copyText(val)} className="text-emerald-700 hover:text-emerald-900"><FaCopy /></button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender Account Title *</label>
                    <input type="text" value={bankSender} onChange={(e) => setBankSender(e.target.value)} placeholder={billing.fullName || 'Sender account title'} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Screenshot *</label>
                    {receipt ? (
                      <div className="relative">
                        <img src={receipt} alt="receipt" className="w-full h-24 object-cover rounded-xl border" />
                        <button type="button" onClick={() => setReceipt(null)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><FaTimes className="text-xs" /></button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-3 py-3.5 cursor-pointer hover:border-amber-500 transition">
                        <FaUpload className="text-amber-500" />
                        <span className="text-xs font-semibold text-gray-600">Upload Receipt</span>
                        <input type="file" accept="image/*" onChange={handleReceipt} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50">Back</button>
              <button type="button" onClick={handlePlaceOrder} disabled={placing}
                className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition disabled:opacity-50 inline-flex items-center gap-2">
                <FaMoneyBillWave />
                {placing ? 'Processing...' : payMethod === 'jazzcash' ? `Pay Now Rs ${grandTotal.toLocaleString()}` : 'I Have Sent the Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
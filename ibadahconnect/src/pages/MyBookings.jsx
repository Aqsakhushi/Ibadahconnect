import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* Universal token helper — kahin se bhi token utha lo */
const getToken = () => {
  try {
    const direct = ['token', 'authToken', 'accessToken', 'jwt'];
    for (const store of [localStorage, sessionStorage]) {
      for (const k of direct) {
        const v = store.getItem(k);
        if (v && !v.startsWith('{')) return v;
      }
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        try {
          const raw = store.getItem(k);
          if (!raw || !raw.startsWith('{')) continue;
          const obj = JSON.parse(raw);
          if (obj && obj.token) return obj.token;
        } catch (e) {}
      }
    }
  } catch (e) {}
  return '';
};

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Assigned: 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Progress': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-red-50 text-red-600 ring-red-200',
};

/* Order ke fields version-safe pick karne ke liye */
const pick = (o, keys) => {
  for (const k of keys) {
    if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  }
  return null;
};

const fmtPKR = (n) => `PKR ${Number(n || 0).toLocaleString('en-PK')}`;

const fmtDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysLeft = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  const diff = Math.ceil((dt.getTime() - Date.now()) / 86400000);
  return diff >= 0 ? diff : null;
};

const BookingCard = ({ o }) => {
  const code = pick(o, ['orderCode', 'code']) || o._id;
  const forName = pick(o, ['name', 'beneficiaryName', 'personName']) || '—';
  const service = pick(o, ['serviceType']) || 'Ibadah Badal';
  const pkg = pick(o, ['packageName', 'packageType', 'package']);
  const date = pick(o, ['date', 'journeyDate', 'startDate', 'scheduledDate']);
  const amount = pick(o, ['price', 'amount', 'totalAmount', 'totalPrice']) || 0;
  const status = o.status || 'Pending';
  const paid = o.paymentStatus === 'Paid';
  const dl = daysLeft(date);
  const perf =
    o.performer && typeof o.performer === 'object'
      ? `${o.performer.firstName || ''} ${o.performer.lastName || ''}`.trim()
      : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-400 tracking-wider">{code}</p>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">
            {service} <span className="text-sm font-medium text-gray-400">for {forName}</span>
          </h3>
          {pkg && <p className="text-sm text-gray-500 mt-0.5">{pkg}</p>}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Date</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtDate(date) || 'To be scheduled'}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Amount</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{fmtPKR(amount)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Payment</p>
          <p className={`text-sm font-semibold mt-0.5 ${paid ? 'text-emerald-600' : 'text-gray-500'}`}>{paid ? 'Paid' : 'Unpaid'}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Performer</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{perf || 'To be assigned'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        {dl !== null ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#8a6d1a] text-xs font-bold ring-1 ring-[#D4AF37]/40">
            {dl === 0 ? 'Scheduled today' : `${dl} day${dl === 1 ? '' : 's'} left`}
          </span>
        ) : (
          <span />
        )}
        <Link to="/track" className="text-sm font-bold text-[#1B5E20] hover:text-[#D4AF37] transition-colors">
          Track Order
        </Link>
      </div>
    </div>
  );
};

const MyBookings = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [error, setError] = useState('');
  const token = getToken();

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch('/api/orders/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch (e) {
        setError('Could not load bookings. Make sure the backend server is running.');
      }
      setLoading(false);
    })();
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50/60 pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Login Required</h2>
          <p className="text-sm text-gray-500 mt-2">Please log in using the Login button at the top to view your bookings.</p>
        </div>
      </div>
    );
  }

  const upcoming = orders.filter((o) => ['Pending', 'Assigned', 'In Progress'].includes(o.status));
  const completed = orders.filter((o) => o.status === 'Completed');
  const totalValue = orders.reduce((s, o) => s + Number(pick(o, ['price', 'amount', 'totalAmount', 'totalPrice']) || 0), 0);
  const shown = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : orders;

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'all', label: 'All', count: orders.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">Your scheduled Ibadah bookings, all in one place.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total Bookings', value: orders.length },
            { label: 'Upcoming', value: upcoming.length },
            { label: 'Completed', value: completed.length },
            { label: 'Total Value', value: fmtPKR(totalValue) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-[#1B5E20] mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-8 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                tab === t.id ? 'bg-[#1B5E20] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B5E20]/40'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {error && <div className="mt-6 bg-red-50 text-red-600 text-sm font-semibold rounded-xl p-4 ring-1 ring-red-100">{error}</div>}

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#1B5E20] border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <h3 className="text-lg font-bold text-gray-900">No bookings here yet</h3>
            <p className="text-sm text-gray-500 mt-1">Book an Ibadah service and it will appear here.</p>
            <Link to="/dashboard" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-bold">
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {shown.map((o) => <BookingCard key={o._id} o={o} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
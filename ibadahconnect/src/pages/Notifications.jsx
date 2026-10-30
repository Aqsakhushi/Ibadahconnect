import { useState, useEffect } from 'react';

/* Universal token helper */
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

const READ_KEY = 'ic_read_notifs';
const getRead = () => { try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) { return []; } };

const IconCalendar = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>);
const IconCard = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19" /></svg>);
const IconUserCheck = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" /><path d="M16 11l2 2 4-4" /></svg>);
const IconClock = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
const IconShield = () => (<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" /><path d="M9.5 12l1.8 1.8 3.7-3.8" /></svg>);

const TYPE_META = {
  booked: { bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: IconCalendar },
  paid: { bg: 'bg-[#D4AF37]/20', text: 'text-[#8a6d1a]', Icon: IconCard },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', Icon: IconUserCheck },
  progress: { bg: 'bg-indigo-100', text: 'text-indigo-700', Icon: IconClock },
  done: { bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: IconShield },
};

const timeAgo = (t) => {
  if (!t) return '';
  const diff = Date.now() - new Date(t).getTime();
  if (isNaN(diff)) return '';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const buildNotifications = (orders) => {
  const items = [];
  orders.forEach((o) => {
    const code = o.orderCode || o._id;
    const svc = o.serviceType || 'Ibadah';
    const who = o.name || o.beneficiaryName || 'your loved one';
    if (o.createdAt) {
      items.push({ id: `${o._id}-booked`, type: 'booked', title: 'Booking confirmed', body: `Your ${svc} booking for ${who} (${code}) is confirmed.`, time: o.createdAt });
    }
    if (o.paymentStatus === 'Paid') {
      items.push({ id: `${o._id}-paid`, type: 'paid', title: 'Payment received', body: `We have received your payment for order ${code}.`, time: o.paidAt || o.updatedAt || o.createdAt });
    }
    if (['Assigned', 'In Progress', 'Completed'].includes(o.status)) {
      const perf = o.performer && typeof o.performer === 'object' ? `${o.performer.firstName || ''} ${o.performer.lastName || ''}`.trim() : '';
      items.push({ id: `${o._id}-assigned`, type: 'assigned', title: 'Performer assigned', body: perf ? `${perf} will perform the Ibadah for order ${code}.` : `A verified performer has been assigned to order ${code}.`, time: o.assignedAt || o.updatedAt || o.createdAt });
    }
    if (['In Progress', 'Completed'].includes(o.status)) {
      items.push({ id: `${o._id}-progress`, type: 'progress', title: 'Ibadah in progress', body: `The Ibadah for order ${code} is currently being performed.`, time: o.updatedAt || o.createdAt });
    }
    if (o.status === 'Completed') {
      items.push({ id: `${o._id}-done`, type: 'done', title: 'Ibadah completed', body: `Order ${code} has been completed. Your certificate will be available soon.`, time: o.updatedAt || o.createdAt });
    }
  });
  items.sort((a, b) => new Date(b.time) - new Date(a.time));
  return items;
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [read, setRead] = useState(getRead());
  const [filter, setFilter] = useState('all');
  const token = getToken();

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch('/api/orders/mine', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const orders = Array.isArray(data) ? data : data.orders || [];
        setItems(buildNotifications(orders));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const unread = items.filter((n) => !read.includes(n.id));

  const markAllRead = () => {
    const all = items.map((n) => n.id);
    setRead(all);
    localStorage.setItem(READ_KEY, JSON.stringify(all));
  };

  const markOne = (id) => {
    const next = read.includes(id) ? read : [...read, id];
    setRead(next);
    localStorage.setItem(READ_KEY, JSON.stringify(next));
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50/60 pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Login Required</h2>
          <p className="text-sm text-gray-500 mt-2">Please log in using the Login button at the top to see your notifications.</p>
        </div>
      </div>
    );
  }

  const shown = filter === 'unread' ? unread : items;

  return (
    <div className="min-h-screen bg-gray-50/60 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">Live updates generated from your Ibadah orders.</p>
          </div>
          <button
            onClick={markAllRead}
            disabled={unread.length === 0}
            className="px-4 py-2 rounded-full text-sm font-bold bg-white border border-gray-200 text-gray-600 hover:border-[#1B5E20]/40 disabled:opacity-40 transition-all"
          >
            Mark all read {unread.length > 0 && `(${unread.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-6">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'unread', label: `Unread (${unread.length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                filter === f.id ? 'bg-[#1B5E20] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B5E20]/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <div className="w-8 h-8 rounded-full animate-spin border-[#1B5E20] border-t-transparent" style={{ borderWidth: 3, borderStyle: 'solid' }} />
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <h3 className="text-lg font-bold text-gray-900">Nothing here yet</h3>
            <p className="text-sm text-gray-500 mt-1">Book your first Ibadah and updates will appear here automatically.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {shown.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.booked;
              const isUnread = !read.includes(n.id);
              const Icon = meta.Icon;
              return (
                <button
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`w-full text-left flex items-start gap-4 bg-white rounded-2xl border shadow-sm p-4 transition-all hover:shadow-md ${isUnread ? 'border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37]/[0.06] to-white' : 'border-gray-100'}`}
                >
                  <div className={`w-10 h-10 rounded-full ${meta.bg} ${meta.text} flex items-center justify-center shrink-0`}>
                    <Icon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{n.title}</p>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 shrink-0">{timeAgo(n.time)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
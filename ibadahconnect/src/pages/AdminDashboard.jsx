import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaBox, FaCalendarCheck, FaUserCheck, FaHistory, FaSignOutAlt, FaMoneyBillWave, FaSearch, FaBell, FaScroll } from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo';
import API from '../api';
import { logout } from '../utils/auth';

// Try compatible route aliases through the central API client.
async function apiGetAny(paths, skipAuthRedirect = false) {
  const list = Array.isArray(paths) ? paths : [paths];
  const errors = [];
  for (const path of list) {
    try {
      const { data } = await API.get(path, { timeout: 5000, skipAuthRedirect });
      return data;
    } catch (error) {
      errors.push(error.response?.status ? `HTTP ${error.response.status}` : error.message);
    }
  }
  throw new Error(errors.join(' | ') || 'No API path configured.');
}

// Accepts a raw array OR wrapped shapes like { users: [...] } / { data: [...] }
const asArray = (d) => {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    if (Array.isArray(d.users)) return d.users;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.packages)) return d.packages;
    if (Array.isArray(d.orders)) return d.orders;
  }
  return [];
};

/* ------------------------------------------------------------------
   SPONSOR RESOLVER (fixes the "Unknown" names in Recent Bookings)
   Order documents store the sponsor under different field names
   depending on the checkout flow (sponsor / sponsorId / user /
   userId / createdBy / customer / owner). The value can be a
   populated object OR a raw string id. This helper turns it into
   { name, email } — raw ids are looked up in the users list.
------------------------------------------------------------------ */
const SPONSOR_KEYS = ['sponsor', 'sponsorId', 'user', 'userId', 'createdBy', 'customer', 'owner'];

function sponsorInfoOf(ord, usersById) {
  let base = null;
  for (const k of SPONSOR_KEYS) {
    const v = ord ? ord[k] : null;
    if (!v) continue;
    if (typeof v === 'object') {
      base = { firstName: v.firstName, lastName: v.lastName, email: v.email };
    } else {
      const u = usersById[String(v)];
      if (u) base = { firstName: u.firstName, lastName: u.lastName, email: u.email };
    }
    if (base && (base.firstName || base.lastName || base.email)) break;
  }
  if (!base && ord) {
    // last resort: order document me khud email/name fields ho
    const email = ord.email || ord.sponsorEmail || ord.customerEmail || '';
    const name = ord.customerName || ord.name || '';
    if (email || name) base = { firstName: name, lastName: '', email };
  }
  const name = base ? [base.firstName, base.lastName].filter(Boolean).join(' ').trim() : '';
  return { name: name || 'Unknown', email: (base && base.email) || '' };
}

// Short human-readable reason for the banner: "HTTP 401", "timeout", ...
const summarizeError = (err) => {
  const msg = (err && err.message) || '';
  const statuses = [...new Set(msg.match(/HTTP \d+/g) || [])].map((s) => s.replace('HTTP ', ''));
  if (statuses.length) return `HTTP ${statuses.join('/')}`;
  if (/abort/i.test(msg)) return 'timeout';
  if (/fetch/i.test(msg)) return 'connection refused';
  return 'network error';
};

// Animated Counter (NaN-safe: works even if `end` is undefined/null)
const Counter = ({ end, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const target = Number(end) || 0;

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Overview Component (Dashboard Stats & Recent Bookings)
export const AdminOverview = () => {
  const [stats, setStats] = useState({ users: 0, packages: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [failedList, setFailedList] = useState([]); // e.g. ["Users: HTTP 401"]
  const [usersById, setUsersById] = useState({});   // sponsor id -> user doc (name/email lookup)

  useEffect(() => {
    let alive = true;

    const fetchStats = async (background = false) => {
      // INDEPENDENT fetches: if one endpoint fails, the others still display.
      const targets = [
        { key: 'Users', paths: ['/auth/all-users', '/users'] },
        { key: 'Packages', paths: ['/packages/all', '/packages'] },
        { key: 'Orders', paths: ['/orders/all', '/orders'] },
      ];

      const results = await Promise.allSettled(targets.map((t) => apiGetAny(t.paths, background)));
      if (!alive) return;

      const failed = [];
      results.forEach((res, i) => {
        const key = targets[i].key;
        if (res.status === 'fulfilled') {
          const arr = asArray(res.value);
          if (key === 'Users') {
            // Build sponsor lookup: order refs that are raw ids get real names from here
            const map = {};
            arr.forEach((u) => { if (u && u._id) map[String(u._id)] = u; });
            setUsersById(map);
            setStats((s) => ({ ...s, users: arr.length }));
          }
          if (key === 'Packages') setStats((s) => ({ ...s, packages: arr.length }));
          if (key === 'Orders') {
            const totalRevenue = arr.reduce((sum, o) => sum + (Number(o && o.price) || 0), 0);
            setStats((s) => ({ ...s, orders: arr.length, revenue: totalRevenue }));
            setRecentOrders(arr.slice(0, 5));
          }
        } else {
          failed.push(`${key}: ${summarizeError(res.reason)}`);
          console.error(
            `[AdminDashboard] ${key} failed:`,
            res.reason && res.reason.message ? res.reason.message : res.reason
          );
        }
      });

      setFailedList(failed);
    };

    fetchStats();
    // AUTO REFRESH: counters update themselves every 15 seconds.
    const timer = setInterval(() => fetchStats(true), 15000);
    const onFocus = () => fetchStats(true); // also refresh when the tab regains focus
    window.addEventListener('focus', onFocus);

    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const ordersFailed = failedList.some((f) => f.startsWith('Orders'));
  const allFailed = failedList.length === 3;

  return (
    <div>
      {/* PARTIAL-FAILURE BANNER — shows exactly which endpoint failed and why */}
      {failedList.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-bold mb-1">
            {allFailed
              ? 'Backend API not reachable — all endpoints failed'
              : 'Some live data could not load'}
          </p>
          <ul className="list-disc ml-5 space-y-0.5 mb-2">
            {failedList.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              Test the backend in the browser: <b>http://localhost:5000/api/packages/all</b> — it should print JSON.
            </li>
            <li>
              If nothing opens there, start the backend (backend folder → <b>npm start</b>, port 5000).
            </li>
            <li>
              If it says <b>HTTP 401/403</b>, log out and log in as admin again (token expired).
            </li>
          </ul>
          <p className="mt-2 text-xs text-red-500">Retrying automatically every 15 seconds...</p>
        </div>
      )}

      {/* Premium Large Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-lg h-48 md:h-56">
        <img
          src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1600&auto=format&fit=crop"
          alt="Makkah"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a14]/95 via-[#0a1a14]/80 to-[#1B5E20]/40"></div>
        <div className="relative p-8 md:p-10 h-full flex flex-col justify-center z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2" style={{ fontFamily: 'Amiri, serif' }}>Dashboard Overview</h1>
          <p className="text-gray-300 text-base">Welcome back, Super Admin. Here is what's happening today.</p>
        </div>
      </div>

      {/* Premium Stats Cards with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

        <Link to="/admin/users" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer block flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
            <FaUsers />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
            <h3 className="text-3xl font-extrabold text-gray-900"><Counter end={stats.users} /></h3>
          </div>
        </Link>

        <Link to="/admin/packages" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-green-500 hover:-translate-y-1 transition-all cursor-pointer block flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl">
            <FaBox />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Packages</p>
            <h3 className="text-3xl font-extrabold text-gray-900"><Counter end={stats.packages} /></h3>
          </div>
        </Link>

        <Link to="/admin/bookings" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-yellow-500 hover:-translate-y-1 transition-all cursor-pointer block flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-2xl">
            <FaCalendarCheck />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Bookings</p>
            <h3 className="text-3xl font-extrabold text-gray-900"><Counter end={stats.orders} /></h3>
          </div>
        </Link>

        <Link to="/admin/bookings" className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all cursor-pointer block flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl">
            <FaMoneyBillWave />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
            <h3 className="text-3xl font-extrabold text-primary">PKR <Counter end={stats.revenue} /></h3>
          </div>
        </Link>
      </div>

      {/* Recent Bookings Table with Avatars */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
          <div className="flex items-center gap-3">
            {failedList.length === 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                Live — auto refreshes every 15s
              </span>
            )}
            <Link to="/admin/bookings" className="text-primary text-sm font-semibold hover:underline">View All</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Sponsor</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-gray-500">
                    {ordersFailed ? 'Waiting for backend connection...' : 'No bookings yet.'}
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord, index) => {
                  const info = sponsorInfoOf(ord, usersById);
                  return (
                  <tr key={ord._id || ord.orderCode || `${ord.serviceType || 'order'}-${index}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
                          {info.name !== 'Unknown' ? info.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{info.name}</p>
                          <p className="text-xs text-gray-400 font-normal">{info.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{ord.serviceType || 'Service'}</td>
                    <td className="py-3 px-4 text-gray-900 font-bold">PKR {(Number(ord.price) || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        ord.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                        ord.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-yellow-50 text-yellow-600 border-yellow-200'
                      }`}>
                        {ord.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Layout Component
const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-outfit flex">

      {/* Sidebar (Background Changed to Deep Green) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1B5E20] p-5 h-screen sticky top-0 z-10 flex-shrink-0">
        {/* Top Left Logo */}
        <div className="px-2 py-4 mb-6 border-b border-white/10">
          <BrandLogo variant="light" size="md" />
          <p className="text-[10px] text-gray-300 mt-2 uppercase tracking-widest">Admin Panel</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <Link to="/admin" end className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaTachometerAlt className="text-lg w-5" /> Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaUsers className="text-lg w-5" /> Manage Users
          </Link>
          <Link to="/admin/packages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaBox className="text-lg w-5" /> Manage Packages
          </Link>
          <Link to="/admin/bookings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaCalendarCheck className="text-lg w-5" /> View Bookings
          </Link>
          <Link to="/admin/performers" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaUserCheck className="text-lg w-5" /> Performer Requests
          </Link>
          <Link to="/admin/history" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaHistory className="text-lg w-5" /> History
          </Link>
          <Link to="/admin/rules" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-100 hover:bg-white/10 hover:text-white transition-all font-semibold text-base">
            <FaScroll className="text-lg w-5" /> Rules & Regulations
          </Link>
        </nav>

        {/* Admin Profile Box at Bottom */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">A</div>
            <div>
              <p className="text-sm font-bold text-white">Admin</p>
              <p className="text-xs text-gray-300">admin@ibadah.com</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-white font-semibold text-sm transition-colors">
            <FaSignOutAlt className="text-base w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Header with Search Bar and Notification Icon */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div className="relative w-64 hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 md:hidden">Admin Portal</h2>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-primary">
              <FaBell className="text-lg" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 hidden md:block">Super Admin</span>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">A</div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PREFS_KEY = 'ic_prefs';
const DEFAULT_PREFS = { emailNotifications: true, orderUpdates: true, marketingEmails: false };

const getPrefs = () => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREFS_KEY)) || {}) };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
};

const Toggle = ({ on, onChange }) => (
  <button
    onClick={() => onChange(!on)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-[#1B5E20]' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`} />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch (e) { return null; }
  });
  const [prefs, setPrefs] = useState(getPrefs);
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  /* Toggle change hote hi save ho jata hai */
  const updatePref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  /* Do dafa click karna zaroori — galti se delete na ho */
  const clearData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    ['ic_donations', 'ic_read_notifs', 'ic_prefs', 'ic_support_msgs'].forEach((k) => localStorage.removeItem(k));
    setPrefs({ ...DEFAULT_PREFS });
    setConfirmClear(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/60 pt-32 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">Login Required</h2>
          <p className="text-sm text-gray-500 mt-2">Please log in using the Login button at the top to manage your settings.</p>
        </div>
      </div>
    );
  }

  const initial = user.firstName ? user.firstName[0].toUpperCase() : 'U';

  const prefRows = [
    { key: 'emailNotifications', title: 'Email Notifications', desc: 'Receive emails about your orders and account activity.' },
    { key: 'orderUpdates', title: 'Order Status Updates', desc: 'Get notified when your Ibadah status changes.' },
    { key: 'marketingEmails', title: 'News & Offers', desc: 'Occasional updates about new services and packages.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/60 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences.</p>

        {/* Account card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] ring-2 ring-[#D4AF37]/60 flex items-center justify-center text-white font-bold text-xl shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#8a6d1a] text-[11px] font-bold uppercase tracking-wide ring-1 ring-[#D4AF37]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                {user.role || 'Member'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div className="bg-gray-50/60 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Phone</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{user.phone || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50/60 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Country</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{user.country || 'Not provided'}</p>
            </div>
            <div className="bg-gray-50/60 rounded-xl p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Member Since</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
            {saved && <span className="text-xs font-bold text-emerald-600">Preferences saved</span>}
          </div>
          <div className="mt-3 divide-y divide-gray-50">
            {prefRows.map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                </div>
                <Toggle on={prefs[p.key]} onChange={(v) => updatePref(p.key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-900">Security</h2>
          <p className="text-sm text-gray-400 mt-0.5">You are signed in on this device.</p>
          <button onClick={handleLogout} className="mt-4 px-5 py-2.5 rounded-full bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-colors">
            Log Out
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold text-red-500">Danger Zone</h2>
          <p className="text-sm text-gray-400 mt-0.5">Clears locally saved app data (donation history, notification read state, preferences, support messages). Your account is not deleted.</p>
          <button
            onClick={clearData}
            className={`mt-4 px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${confirmClear ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
          >
            {confirmClear ? 'Click again to confirm' : 'Clear Local App Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
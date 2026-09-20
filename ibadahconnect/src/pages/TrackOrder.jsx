import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API from '../api';
import OrderChat from '../components/OrderChat';
import {
  FaSearch, FaMosque, FaCheckCircle, FaMapMarkerAlt, FaReceipt, FaComments,
  FaClipboardList, FaSpinner, FaHourglassHalf, FaUserCircle, FaImage,
  FaExternalLinkAlt, FaBoxOpen,
} from 'react-icons/fa';

const STEPS = ['Pending', 'Assigned', 'In Progress', 'Completed'];
const STEP_ICON = {
  Pending: FaHourglassHalf,
  Assigned: FaUserCircle,
  'In Progress': FaSpinner,
  Completed: FaCheckCircle,
};

const STATUS_CHIP = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Assigned: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PAY_CHIP = {
  Unpaid: 'bg-gray-100 text-gray-600',
  Paid: 'bg-emerald-100 text-emerald-700',
  'Under Review': 'bg-amber-100 text-amber-700',
};

export default function TrackOrder() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);

  const load = async (c) => {
    if (!c) return;
    setLoading(true);
    try {
      const res = await API.get(`/track/${encodeURIComponent(c)}`);
      setOrder(res.data);
      setErr('');
    } catch (e) {
      setOrder(null);
      setErr(e.response?.data?.message || 'No order found with this Order ID. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) load(code);
    else { setOrder(null); setErr(''); }
  }, [code]);

  // Auto refresh every 20s — new milestones appear automatically
  useEffect(() => {
    if (!code) return;
    const t = setInterval(() => load(code), 20000);
    return () => clearInterval(t);
  }, [code]);

  // Load MY recent orders (only when logged in) — client-side filtered to be safe
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u && (u.id || u._id)) {
        API.get('/orders/mine')
          .then((res) => {
            const arr = Array.isArray(res.data) ? res.data : res.data?.orders || [];
            const mine = arr.filter(
              (x) => String(x?.sponsor?._id || x?.sponsor || '') === String(u.id || u._id || '')
            );
            setMyOrders(mine.slice(0, 4));
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const c = input.trim();
    if (!c) return;
    navigate(`/track/${encodeURIComponent(c)}`);
  };

  const o = order;
  const milestones = Array.isArray(o?.milestones) ? o.milestones : [];
  const stepIdx = o ? STEPS.indexOf(o.status) : -1;
  const loc = o?.proofLocation;
  const hasLoc = loc && Number(loc.lat) !== 0 && Number(loc.lng) !== 0;
  const performerName = o?.performer && typeof o.performer === 'object'
    ? `${o.performer.firstName || ''} ${o.performer.lastName || ''}`.trim() || 'Your Performer'
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* ===== Search card ===== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2 mb-1"><FaSearch className="text-emerald-700" /> Track My Order</h2>
        <p className="text-xs text-gray-500 mb-4">Enter your Order ID (e.g. IC-2025-123456) to see live status, performer milestones, proof photo and location.</p>
        <form onSubmit={submit} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="IC-2025-XXXXXX"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600" />
          <button type="submit" disabled={loading}
            className="bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-900 transition disabled:opacity-50">
            {loading ? 'Checking...' : 'Track'}
          </button>
        </form>
      </div>

      {/* ===== My Recent Orders (logged-in users only) ===== */}
      {myOrders.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><FaClipboardList className="text-emerald-700" /> My Recent Orders</h3>
          <div className="space-y-2">
            {myOrders.map((mo, i) => (
              <button key={mo._id || i}
                onClick={() => { if (mo.orderCode) navigate(`/track/${encodeURIComponent(mo.orderCode)}`); }}
                className="w-full flex items-center justify-between gap-3 border border-gray-100 rounded-2xl px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{mo.serviceTitle || mo.packageTitle || mo.serviceType || 'Ibadah'}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{mo.orderCode}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_CHIP[mo.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{mo.status || '—'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-semibold mb-6">{err}</div>
      )}

      {loading && !o && !err && (
        <div className="text-center py-14"><FaSpinner className="text-3xl text-emerald-700 animate-spin mx-auto" /></div>
      )}

      {o && (
        <>
          {/* ===== Order header ===== */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-900 text-amber-400 flex items-center justify-center text-xl shrink-0"><FaMosque /></div>
                <div className="min-w-0">
                  <p className="font-extrabold text-gray-900 truncate">{o.serviceTitle || o.packageTitle || o.serviceType || 'Ibadah'}</p>
                  <p className="text-xs text-gray-500 font-mono">{o.orderCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_CHIP[o.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{o.status}</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${PAY_CHIP[o.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>{o.paymentStatus || 'Unpaid'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-xs">
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Placed On</p>
                <p className="text-gray-800 font-semibold mt-0.5">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Amount</p>
                <p className="text-gray-800 font-semibold mt-0.5">Rs {(o.price || 0).toLocaleString()}{o.hadiyah ? ` + Rs ${o.hadiyah.toLocaleString()} Hadiyah` : ''}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 col-span-2 sm:col-span-1">
                <p className="text-gray-400 font-bold uppercase text-[10px]">For</p>
                <p className="text-gray-800 font-semibold mt-0.5 truncate">{o.recipient || o.beneficiaryName || '—'}</p>
              </div>
            </div>
          </div>

          {/* ===== Status stepper ===== */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-extrabold text-gray-900 mb-5">Order Progress</h3>
            <div className="flex items-start">
              {STEPS.map((s, i) => {
                const Icon = STEP_ICON[s];
                const done = stepIdx >= i;
                const last = i === STEPS.length - 1;
                return (
                  <div key={s} className="flex-1 flex flex-col items-center relative">
                    {!last && <div className={`absolute top-5 left-1/2 w-full h-1 ${stepIdx > i ? 'bg-emerald-600' : 'bg-gray-200'}`} />}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center relative z-10 border-2 ${done ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 text-gray-300'} ${s === 'In Progress' && done ? 'animate-pulse' : ''}`}>
                      <Icon className="text-sm" />
                    </div>
                    <p className={`text-[10px] font-bold mt-2 text-center ${done ? 'text-emerald-800' : 'text-gray-400'}`}>{s}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== Performer Milestones ===== */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2"><FaClipboardList className="text-emerald-700" /> Performer Milestones</h3>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{milestones.length} Completed</span>
            </div>
            {milestones.length === 0 ? (
              <div className="text-center py-8">
                <FaBoxOpen className="text-4xl text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Your performer has not completed any milestone yet.</p>
                <p className="text-[11px] text-gray-400 mt-1">Updates will appear here automatically as your Ibadah progresses.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0"><FaCheckCircle className="text-sm" /></div>
                      {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-emerald-200 my-1" />}
                    </div>
                    <div className="pb-5 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{m.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {m.checkedAt ? new Date(m.checkedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      {m.proofOcr && Array.isArray(m.proofOcr.matched) && m.proofOcr.matched.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {m.proofOcr.matched.map((w, wi) => (
                            <span key={wi} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{w}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Proof & Live Location ===== */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><FaMapMarkerAlt className="text-emerald-700" /> Proof & Location</h3>
            {o.proofUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-100 mb-4">
                <img src={o.proofUrl} alt="Ibadah proof" className="w-full max-h-80 object-cover" />
                <p className="text-[10px] text-gray-400 px-3 py-2 bg-gray-50 flex items-center gap-1.5"><FaImage /> Photo proof submitted by performer{o.proofSubmittedAt ? ` — ${new Date(o.proofSubmittedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
              </div>
            )}
            {hasLoc ? (
              <div>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <iframe
                    title="Performer Location"
                    src={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=15&output=embed`}
                    className="w-full h-56 border-0"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-gray-500">Location captured{loc.capturedAt ? ` — ${new Date(loc.capturedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                  <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1.5"><FaExternalLinkAlt /> Open in Google Maps</a>
                </div>
              </div>
            ) : (
              !o.proofUrl && (
                <p className="text-sm text-gray-500 text-center py-4">Proof photo and live location will appear here once the performer submits evidence.</p>
              )
            )}
          </div>

          {/* ===== Payment & Receipt ===== */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2"><FaReceipt className="text-emerald-700" /> Payment Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Method</p>
                <p className="text-gray-800 font-semibold mt-0.5">{o.paymentMethod || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Status</p>
                <p className="text-gray-800 font-semibold mt-0.5">{o.paymentStatus || 'Unpaid'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-gray-400 font-bold uppercase text-[10px]">Reference</p>
                <p className="text-gray-800 font-semibold mt-0.5 font-mono truncate">{o.paymentRef || '—'}</p>
              </div>
            </div>
            {o.receiptUrl && (
              <div className="mt-4 flex items-center gap-4 bg-teal-50 border border-teal-100 rounded-2xl p-3">
                <a href={o.receiptUrl} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={o.receiptUrl} alt="Payment receipt" className="w-16 h-16 rounded-xl object-cover border border-teal-200" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-teal-900">Payment Screenshot</p>
                  <p className="text-[10px] text-teal-700/70">Bank transfer receipt submitted with this order.</p>
                </div>
                <a href={o.receiptUrl} download target="_blank" rel="noreferrer"
                  className="shrink-0 bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-teal-800 transition inline-flex items-center gap-1.5"><FaReceipt /> Download</a>
              </div>
            )}
          </div>

          {/* ===== Performer & Chat ===== */}
          <div className="bg-emerald-900 rounded-3xl shadow-sm p-6 text-white flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-amber-400/90 text-emerald-950 flex items-center justify-center text-lg font-bold uppercase shrink-0">
                {performerName ? performerName.charAt(0) : <FaUserCircle />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{performerName || 'Performer not assigned yet'}</p>
                <p className="text-[11px] text-emerald-200/70">Chat is available once a performer is assigned to this order.</p>
              </div>
            </div>
            {o.performer && (
              <button onClick={() => setChatOpen(true)}
                className="w-fit bg-amber-400 text-emerald-950 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-300 transition inline-flex items-center gap-2 shrink-0">
                <FaComments /> Chat with Performer
              </button>
            )}
          </div>
        </>
      )}

      {chatOpen && o && (
        <OrderChat orderId={o._id} orderCode={o.orderCode} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}
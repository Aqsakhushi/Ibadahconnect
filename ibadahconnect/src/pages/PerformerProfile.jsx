import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API from '../api';
import { getCurrentUser } from '../utils/auth';
import OrderChat from '../components/OrderChat';
import {
  FaMosque, FaCheckCircle, FaMapMarkerAlt, FaComments, FaSpinner,
  FaCalendarAlt, FaShieldAlt, FaBoxOpen, FaArrowLeft, FaImage,
} from 'react-icons/fa';

export default function PerformerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const current = getCurrentUser();
  const uid = current?.id || current?._id || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/chat/performer/${id}`, { params: uid ? { userId: uid } : {} });
        setData(res.data);
        setErr('');
      } catch (e) {
        setErr(e.response?.data?.message || 'Performer profile could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <FaSpinner className="text-4xl text-emerald-700 animate-spin mb-4" />
        <p className="text-sm text-gray-500 font-semibold">Loading performer profile...</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <FaBoxOpen className="text-5xl text-gray-200 mx-auto mb-4" />
        <p className="text-sm text-gray-600 font-semibold mb-5">{err || 'Profile not found.'}</p>
        <button onClick={() => navigate(-1)} className="bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-900 transition inline-flex items-center gap-2"><FaArrowLeft /> Go Back</button>
      </div>
    );
  }

  const p = data.performer || {};
  const stats = data.stats || { completed: 0, inProgress: 0 };
  const feed = Array.isArray(data.feed) ? data.feed : [];
  const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Performer';
  const place = [p.city, p.country].filter(Boolean).join(', ') || 'Haramain';
  const memberSince = p.createdAt ? new Date(p.createdAt).getFullYear() : '—';
  const chatOrderId = data.chatOrderId ? String(data.chatOrderId) : null;
  const chatOrderCode = data.chatOrderCode || null;

  const fallbackImg = (e) => { e.target.style.display = 'none'; };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

      {/* ===== Facebook-style Cover ===== */}
      <div className="relative h-44 sm:h-60 rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700 shadow-lg">
        <FaMosque className="absolute -right-8 -bottom-10 text-[170px] text-white/5" />
        <div className="absolute top-4 left-5 bg-white/15 backdrop-blur text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
          <FaShieldAlt /> IbadahConnect Verified Performer
        </div>
        <div className="absolute bottom-4 right-5 text-white/80 text-[11px] font-semibold">{place}</div>
      </div>

      {/* ===== Avatar + Name (overlap like Facebook) ===== */}
      <div className="px-3 sm:px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {p.profilePic ? (
              <img src={p.profilePic} alt={fullName} onError={fallbackImg}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white shadow-xl bg-emerald-100" />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-800 text-white flex items-center justify-center text-4xl font-extrabold ring-4 ring-white shadow-xl uppercase">
                {fullName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                {fullName}
                <span title="Verified Performer" className="text-emerald-600"><FaCheckCircle /></span>
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <FaMapMarkerAlt className="text-emerald-600" /> {place} · Performer
              </p>
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                <FaCalendarAlt /> Member since {memberSince}
              </p>
            </div>
            <button
              onClick={() => { if (chatOrderId) setChatOpen(true); }}
              disabled={!chatOrderId}
              className={`w-fit inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${chatOrderId ? 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-lg shadow-emerald-900/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              <FaComments /> {chatOrderId ? 'Message' : 'Message (book first)'}
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-800">{stats.completed}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700/70 mt-0.5">Completed Ibadah</p>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-blue-700">{stats.inProgress}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700/70 mt-0.5">In Progress</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-700">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700/70 mt-0.5">Verified Proof</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== About + Feed ===== */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6 px-3 sm:px-6">
        {/* About card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-20">
            <h3 className="font-extrabold text-gray-900 mb-3">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {p.bio || `${fullName} is a verified IbadahConnect performer serving sponsors by completing Umrah, Hajj Badal and charitable Ibadah on their behalf in the Holy Haramain. Every milestone is documented with photo proof and live location so sponsors can follow along with complete trust.`}
            </p>
            <div className="mt-4 space-y-2.5">
              <p className="text-xs text-gray-500 flex items-center gap-2"><FaMapMarkerAlt className="text-emerald-600" /> {place}</p>
              <p className="text-xs text-gray-500 flex items-center gap-2"><FaShieldAlt className="text-emerald-600" /> Identity & documents verified</p>
              <p className="text-xs text-gray-500 flex items-center gap-2"><FaCheckCircle className="text-emerald-600" /> Photo proof on every milestone</p>
            </div>
          </div>
        </div>

        {/* Feed (post style) */}
        <div className="lg:col-span-2">
          <h3 className="font-extrabold text-gray-900 mb-3">Recent Completed Ibadah</h3>
          {feed.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm text-center py-12">
              <FaBoxOpen className="text-5xl text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No completed Ibadah to show yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((f, idx) => (
                <div key={f._id || idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Post header */}
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold uppercase shrink-0">
                      {fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{fullName} <span className="text-emerald-600 align-middle"><FaCheckCircle className="inline text-xs" /></span></p>
                      <p className="text-[11px] text-gray-400">
                        {f.completedAt || f.createdAt ? new Date(f.completedAt || f.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">Completed</span>
                  </div>
                  {/* Post body */}
                  <div className="px-5 pb-4">
                    <p className="text-sm font-bold text-gray-900">{f.packageTitle || f.serviceType || 'Ibadah'}</p>
                    <p className="text-xs text-gray-500 mt-1">This Ibadah has been completed on behalf of the sponsor and verified with photo proof. {(f.milestones || []).length > 0 ? `${(f.milestones || []).length} milestones were completed and documented.` : ''}</p>
                    {(f.milestones || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {f.milestones.slice(0, 4).map((m, mi) => (
                          <span key={mi} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><FaCheckCircle className="text-emerald-600" /> {m.title}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Post image */}
                  {f.proofUrl && (
                    <div className="h-56 bg-gray-100 overflow-hidden">
                      <img src={f.proofUrl} alt="Proof" onError={fallbackImg} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {/* Post footer */}
                  <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-50">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5"><FaCheckCircle /> Verified Completion</span>
                    {f.proofUrl && <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 ml-3"><FaImage /> Photo Proof Attached</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat modal */}
      {chatOpen && chatOrderId && (
        <OrderChat orderId={chatOrderId} orderCode={chatOrderCode} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}
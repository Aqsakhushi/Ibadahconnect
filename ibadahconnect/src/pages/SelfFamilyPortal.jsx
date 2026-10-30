import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';
import {
  FaSignOutAlt, FaUserCircle, FaUsers, FaHandshake, FaBuilding, FaHourglassHalf,
  FaCheckCircle, FaUserCheck, FaExternalLinkAlt, FaInfoCircle, FaGlobe
} from 'react-icons/fa';

// ============================================================
// SELF & FAMILY PORTAL
// Self/Family performers do NOT get the task dashboard (they
// perform Umrah themselves). Instead they see their agency
// connection status and visit the partner agency website.
// ============================================================
const SelfFamilyPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [profilePic, setProfilePic] = useState((JSON.parse(localStorage.getItem('user')) || {}).profilePic || '');
  const [requesting, setRequesting] = useState(false);

  // Mount par fresh profile DB se lao (agency status updated rahe)
  useEffect(() => {
    if (!user.id || user.id === 'admin_id') return;
    API.get(`/auth/user/${user.id}`).then(res => {
      const u = res.data || {};
      setUser(prev => ({ ...prev, ...u, id: user.id }));
      if (u.profilePic) setProfilePic(u.profilePic);
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...u, id: user.id }));
    }).catch(() => {});
  }, []);

  const agencyConnect = user.agencyConnect || 'None';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleAgencyRequest = async () => {
    setRequesting(true);
    try {
      const res = await API.post('/auth/agency-request');
      setUser(prev => ({ ...prev, agencyConnect: 'Requested' }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), agencyConnect: 'Requested' }));
      toast.success(res.data.message || 'Request sent! Admin will contact you soon.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 font-outfit">

      {/* ================= HEADER ================= */}
      <header className="bg-[#1B5E20] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-accent" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35" stroke="#D4AF37" strokeWidth="5" />
              <path d="M35 70 Q50 35 65 70 Z" fill="#D4AF37" />
            </svg>
            <h1 className="text-lg md:text-xl font-bold tracking-wide">Self &amp; Family Portal</h1>
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-5">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-green-100 shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white text-3xl border-4 border-green-100 shadow-md font-bold">
                {user?.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
              </div>
            )}
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">{user?.firstName} {user?.lastName}</h2>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <FaUsers /> Self / Family Performer
                </span>
                {user.isVerified && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                    <FaUserCheck /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{user?.email}</p>
            </div>
          </div>

          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <FaInfoCircle className="text-blue-500 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              You are registered as a <strong>Self / Family performer</strong> — you (or a family member) perform Umrah
              yourself, so the task dashboard does not apply to you. Connect with our partner agency below to arrange
              your Umrah trip (visa, hotel, transport).
            </p>
          </div>
        </div>

        {/* Agency Connection Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
            <FaHandshake className="text-primary" /> Agency Connection
          </h3>
          <p className="text-xs text-gray-400 mb-5">
            Once connected, your partner agency handles all travel arrangements for your Umrah journey.
          </p>

          {/* --- CONNECTED: agency name + Visit Website button --- */}
          {agencyConnect === 'Connected' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <FaBuilding className="text-green-600 text-2xl mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Connected Agency</p>
                  <p className="text-lg font-extrabold text-green-800">{user.agencyName || 'Partner Agency'}</p>
                  {user.agencyWebsite && (
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1">
                      <FaGlobe /> {user.agencyWebsite.replace(/^https?:\/\//, '')}
                    </p>
                  )}
                  <p className="text-[11px] text-green-600 mt-2">
                    The agency will contact you soon with your travel details and booking confirmation.
                  </p>
                </div>
              </div>
              {user.agencyWebsite && (
                <a
                  href={user.agencyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <FaGlobe /> Visit Agency Website <FaExternalLinkAlt className="text-xs" />
                </a>
              )}
            </div>
          )}

          {/* --- REQUESTED: pending --- */}
          {agencyConnect === 'Requested' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
              <FaHourglassHalf className="text-amber-600 text-2xl mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700">Request Pending — waiting for Admin approval</p>
                <p className="text-[11px] text-amber-600 mt-1">
                  The Admin will review your request and connect you with a partner agency. You will see the agency
                  website here once connected.
                </p>
              </div>
            </div>
          )}

          {/* --- NONE: request button --- */}
          {agencyConnect === 'None' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-600 mb-4">
                You are not connected to any agency yet. Send a request and the Admin will connect you with a trusted
                partner agency for your Umrah trip.
              </p>
              <button
                onClick={handleAgencyRequest}
                disabled={requesting}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {requesting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaHandshake />}
                Request Agency Connection
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
          <FaCheckCircle className="text-green-500" />
          <p className="text-xs text-gray-500">
            Need help? Contact us at <span className="font-bold text-gray-700">support@ibadahconnect.com</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelfFamilyPortal;
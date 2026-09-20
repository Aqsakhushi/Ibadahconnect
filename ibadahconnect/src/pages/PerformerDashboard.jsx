import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';
import {
  FaTasks, FaSignOutAlt, FaUserCircle, FaHistory, FaStar, FaRegComment, FaCog, FaWallet,
  FaCommentDots, FaSearch, FaBell, FaPaperPlane, FaTimesCircle, FaCheck, FaUserTag,
  FaMoneyBillWave, FaPrayingHands, FaPlay, FaLink, FaTrophy, FaSyncAlt, FaVideo, FaMosque,
  FaCheckCircle, FaHourglassHalf, FaLock, FaExternalLinkAlt, FaUserCheck, FaScroll, FaMapMarkerAlt, FaRobot, FaClock
} from 'react-icons/fa';

// ═══════ MODULE HELPERS (NEW) ═══════

// Request ka time nice format mein (e.g. "5 min ago")
const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Kya yeh date aaj ki hai? (Daily limit rule)
const isSameDay = (a) => {
  if (!a) return false;
  const d1 = new Date(a), d2 = new Date();
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const PerformerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [profilePic, setProfilePic] = useState(localStorage.getItem('performerPic') || '');
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  // Proof Modal State (window.prompt ki jagah professional modal)
  const [proofModal, setProofModal] = useState(null); // { orderId, milestoneIndex, step }
  const [proofUrl, setProofUrl] = useState('');
  const [proofSaving, setProofSaving] = useState(false);

  // AUTOMATIC LOCATION state (Meeting requirement #2)
  const [locStatus, setLocStatus] = useState('idle'); // idle | capturing | captured | error
  const [proofLocation, setProofLocation] = useState(null); // { lat, lng, capturedAt }

  // OCR PROOF VERIFICATION state (Meeting requirement #1)
  const [ocrStatus, setOcrStatus] = useState('idle'); // idle | checking | done | skip | error
  const [ocrResult, setOcrResult] = useState(null);   // { text, confidence, matched, score, suggestion }

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Admin', text: 'Assalamu Alaikum! Welcome to IbadahConnect Performer Portal.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // ═══ ROLE GUARD (NEW): Sirf Performer role is portal ko access kar sakta hai ═══
  useEffect(() => {
    const r = String(user?.role || '').toLowerCase();
    if (r && r !== 'performer') {
      toast.error('Sponsor accounts cannot access the Performer Portal.');
      navigate('/dashboard');
    }
  }, []);

  // ---------- DATA HELPERS ----------
  // FIX: backend performer ko populate karke OBJECT bhejta hai, isliye _id nikalna zaroori hai
  const performerIdOf = (o) => (o.performer ? (typeof o.performer === 'object' ? o.performer._id : o.performer) : null);
  const isMine = (o) => performerIdOf(o) === user.id;

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/orders/all');
      setAllOrders(res.data);
    } catch (err) {
      if (!silent) toast.error('Tasks load nahi huay. Server check karein.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // ═══ UPDATED: har 5 second silent refresh — naye requests foran nazar aayenge ═══
    const timer = setInterval(() => fetchTasks(true), 5000);
    return () => clearInterval(timer);
  }, [fetchTasks]);

  // ---------- DERIVED DATA (Real DB se) ----------
  const myAssigned = allOrders.find(o => isMine(o) && o.status === 'Assigned');
  const myActive = allOrders.find(o => isMine(o) && o.status === 'In Progress');
  const myCompleted = allOrders.filter(o => isMine(o) && o.status === 'Completed');
  // ═══ UPDATED ("log same ni hon"): apna hi order (jisme main khud sponsor hoon) list mein NAHI ═══
  const newRequests = allOrders.filter(o => {
  if (!o || o.status !== 'Pending') return false;
  const sponsorId = o.sponsor?._id || o.sponsor;
  if (String(sponsorId) === String(user?.id)) return false;
  // SIRF last 24 hours ke Pending orders "New" hain — June/purane test orders gayab
  const created = new Date(o.createdAt).getTime();
  if (isNaN(created) || Date.now() - created > 24 * 60 * 60 * 1000) return false;
  return true;
});
  const isBusy = !!(myAssigned || myActive);
  const activeTask = myActive || myAssigned;

  // ═══ NEW: INSTANT ALERT — naye requests par toast + beep sound ═══
  const prevRequestsRef = useRef(0);
  const firstLoadRef = useRef(true);
  useEffect(() => {
    const count = newRequests.length;
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      prevRequestsRef.current = count;
      return;
    }
    if (count > prevRequestsRef.current) {
      const fresh = count - prevRequestsRef.current;
      toast.success(`🔔 ${fresh} new task request${fresh > 1 ? 's' : ''} received!`, { duration: 6000 });
      try {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.9);
        osc.start();
        osc.stop(actx.currentTime + 1);
      } catch (e) {}
    }
    prevRequestsRef.current = count;
  }, [newRequests.length]);

  // MEETING RULE: "Hide Donation Price" — Donation request ka amount sirf Admin/Sponsor dekh sakte hain.
  // Performer ko sirf ye label nazar aata hai (Umrah/Hajj Badal orders pe price normal rehta hai).
  const isDonation = (o) => o?.serviceType === 'Donation';
  const PRICE_HIDDEN = '🔒 Price Hidden — Rules & Regulations Apply';
  const totalEarnings = myCompleted.filter(o => !isDonation(o)).reduce((sum, o) => sum + Math.round((o.price || 0) * 0.85), 0);
  const pendingEarnings = myActive && !isDonation(myActive) ? Math.round((myActive.price || 0) * 0.85) : 0;

  // ═══ NEW: DAILY LIMIT — 1 din = sirf 1 task (active hai ya aaj complete kiya) ═══
  const acceptedToday = (allOrders || []).some(o => {
    if (!o) return false;
    const pid = o.performer?._id || o.performer;
    if (String(pid) !== String(user?.id)) return false;
    if (o.status === 'Assigned' || o.status === 'In Progress') return true;
    if (o.status === 'Completed' && isSameDay(o.completedAt)) return true;
    return false;
  });
  
  // ---------- ACTIONS ----------
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleStartTask = async (orderId) => {
    // ═══ NEW GUARD: daily limit ═══
    if (acceptedToday) {
      toast.error('Daily limit reached — you can accept only 1 task per day. Come back tomorrow.');
      return;
    }
    try {
      const res = await API.put(`/orders/accept-task/${orderId}`, { performerId: user.id });
      toast.success(res.data.message || 'Task started! Milestones unlock ho gaye.');
      await fetchTasks(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting task.');
    }
  };

  const openProofModal = (order, milestoneIndex, step) => {
    setProofUrl('');
    setOcrStatus('idle');
    setOcrResult(null);
    setProofModal({ orderId: order._id, milestoneIndex, step, serviceType: order.serviceType, price: order.price });
  };

  // AUTOMATIC LOCATION: Proof modal khulte hi browser se GPS coordinates auto-capture
  useEffect(() => {
    if (proofModal && navigator.geolocation) {
      setLocStatus('capturing');
      setProofLocation(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setProofLocation({
            lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
            lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
            capturedAt: new Date().toISOString()
          });
          setLocStatus('captured');
        },
        () => setLocStatus('error'),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, [proofModal]);

  // OCR PROOF VERIFICATION: image (receipt/photo) link par AI text-extraction check
  const looksLikeImage = (url) => /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url) || url.startsWith('data:image');

  const runOcrCheck = async (url) => {
    if (!url || !looksLikeImage(url)) return;
    setOcrStatus('checking');
    try {
      const res = await API.post('/proof/ocr-check', {
        proofUrl: url,
        serviceType: proofModal?.serviceType || '',
        // PRIVACY: Donation orders par amount kabhi nahi bhejte (price hidden rule)
        amount: proofModal && !isDonation(proofModal) ? proofModal.price : undefined
      });
      setOcrResult(res.data.ocr || null);
      setOcrStatus(res.data.skippable ? 'skip' : 'done');
      if (res.data.skippable) toast(res.data.message, { icon: 'ℹ' });
    } catch {
      setOcrStatus('error');
    }
  };

  // Auto-run: image link paste hote hi (700ms debounce) AI check khud shuru
  useEffect(() => {
    if (!proofModal || !proofUrl.trim() || !looksLikeImage(proofUrl.trim())) return;
    const t = setTimeout(() => runOcrCheck(proofUrl.trim()), 700);
    return () => clearTimeout(t);
  }, [proofUrl, proofModal]);

  const submitProof = async () => {
    if (!proofUrl.trim()) {
      toast.error('Proof link enter karein (YouTube / Drive link).');
      return;
    }
    setProofSaving(true);
    try {
      const res = await API.put(`/orders/update-milestone/${proofModal.orderId}`, {
        milestoneIndex: proofModal.milestoneIndex,
        proofUrl: proofUrl.trim(),
        proofLocation: proofLocation || undefined,
        proofOcr: ocrResult || undefined
      });
      setProofModal(null);
      if (res.data.orderCompleted) {
        toast.success('Mubarak ho! Saare milestones complete — Order COMPLETED! 🎉', { duration: 5000 });
      } else {
        toast.success(`Milestone complete! (${res.data.completedMilestones}/${res.data.totalMilestones})${ocrResult?.suggestion === 'verified' ? ' — AI Verified ✓' : ''}`);
      }
      await fetchTasks(true);
    } catch (err) {
      toast.error('Error updating milestone.');
    } finally {
      setProofSaving(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages([...chatMessages, { sender: 'Me', text: newMessage }]);
    setNewMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'Admin', text: 'Noted. JazakAllah Khair.' }]);
    }, 1500);
  };

  // Progress helpers
  const milestoneProgress = (order) => {
    const ms = order.milestones || [];
    const done = ms.filter(m => m.isCompleted).length;
    return { done, total: ms.length, pct: ms.length ? Math.round((done / ms.length) * 100) : 0 };
  };

  const menuItems = [
    { id: 'tasks', icon: <FaTasks />, label: 'Dashboard' },
    { id: 'history', icon: <FaHistory />, label: 'History' },
    { id: 'feedbacks', icon: <FaRegComment />, label: 'Feedbacks' },
    { id: 'earnings', icon: <FaWallet />, label: 'Earnings' },
    { id: 'settings', icon: <FaCog />, label: 'Settings' },
  ];

  // ---------- MILESTONE CHECKLIST (Active task ke liye) ----------
  const MilestoneList = ({ order }) => {
    const prog = milestoneProgress(order);
    return (
      <div>
        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</p>
            <p className="text-xs font-bold text-primary">{prog.done} / {prog.total} Milestones ({prog.pct}%)</p>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${prog.pct}%` }}></div>
          </div>
        </div>

        <div className="space-y-2.5">
          {(order.milestones || []).map((m, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${m.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-primary/40'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${m.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {m.isCompleted ? <FaCheck className="text-xs" /> : idx + 1}
                </span>
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${m.isCompleted ? 'text-green-700 line-through' : 'text-gray-700'}`}>{m.step}</p>
                  {m.isCompleted && m.proofUrl && (
                    <a href={m.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <FaVideo /> View Proof <FaExternalLinkAlt className="text-[9px]" />
                    </a>
                  )}
                  {m.isCompleted && m.proofLocation && (
                    <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                      <FaMapMarkerAlt /> Location Verified ({m.proofLocation.lat}, {m.proofLocation.lng})
                    </p>
                  )}
                  {m.isCompleted && m.proofOcr?.suggestion === 'verified' && (
                    <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                      <FaRobot /> AI Verified — OCR (score {m.proofOcr.score})
                    </p>
                  )}
                </div>
              </div>
              {!m.isCompleted ? (
                <button
                  onClick={() => openProofModal(order, idx, m.step)}
                  className="bg-primary text-white font-bold px-3.5 py-2 rounded-lg text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                >
                  <FaCheckCircle /> Complete + Proof
                </button>
              ) : (
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">DONE</span>
              )}
            </div>
          ))}
        </div>

        {/* Completion Banner */}
        {prog.pct === 100 && (
          <div className="mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 flex items-center gap-3 text-white">
            <FaTrophy className="text-3xl" />
            <div>
              <p className="font-extrabold">Mubarak Ho! Task Completed! 🎉</p>
              <p className="text-xs opacity-90">Order status "Completed" ho gaya. Sponsor ko proof videos mil gaye hain.</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 font-outfit pb-20 md:pb-0">

      {/* ================= HEADER ================= */}
      <header className="bg-[#1B5E20] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-8 h-8 text-accent" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35" stroke="#D4AF37" strokeWidth="5"/>
              <path d="M35 70 Q50 35 65 70 Z" fill="#D4AF37" />
            </svg>
            <h1 className="text-xl font-bold tracking-wide hidden md:block">Performer Portal</h1>
          </div>

          <div className="relative flex-1 max-w-md hidden md:block">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <button onClick={() => fetchTasks()} title="Refresh" className="text-lg hover:bg-white/10 p-2 rounded-lg">
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="relative text-lg hover:bg-white/10 p-2 rounded-lg" title="Notifications">
              <FaBell />
              {(newRequests.length > 0 || myAssigned) && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-[#1B5E20] text-[10px] flex items-center justify-center font-bold px-0.5">
                  {newRequests.length + (myAssigned ? 1 : 0)}
                </span>
              )}
            </button>
            <button onClick={() => setIsChatOpen(true)} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg hidden md:flex items-center gap-2">
              <FaCommentDots /> Live Chat
            </button>
            <button onClick={handleLogout} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2">
              <FaSignOutAlt /> <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 px-4">

        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=400&auto=format&fit=crop')" }}></div>
            <div className="p-4 flex flex-col items-center -mt-12">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white text-4xl border-4 border-white shadow-md font-bold">
                  {user?.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900 mt-3 text-center">{user?.firstName} {user?.lastName}</h2>
              {user?.isVerified !== undefined && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  {user.isVerified ? <><FaUserCheck className="text-green-500" /> Verified Performer</> : 'Verification pending'}
                </p>
              )}

              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-2 ${isBusy ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                {isBusy ? 'Busy with Task' : 'Available for Tasks'}
              </div>
            </div>

            <nav className="p-4 border-t border-gray-100 space-y-1 mt-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon} {item.label}
                  {item.id === 'tasks' && (newRequests.length > 0 || myAssigned) && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newRequests.length + (myAssigned ? 1 : 0)}</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => navigate('/performer-rules')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm text-purple-600 hover:bg-purple-50 border border-purple-100 transition-colors"
              >
                <FaScroll /> Rules & Regulations
              </button>
            </nav>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="lg:col-span-6 space-y-6">

          {activeTab === 'tasks' && (
            <>
              {/* Welcome Banner */}
              <div className="relative rounded-xl overflow-hidden h-32 flex items-center p-6 bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] shadow-md">
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold text-white">Assalamu Alaikum, {user?.firstName}!</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {myActive ? 'Your task is in progress. Complete milestones with proof.' : myAssigned ? 'Admin ne aapko task assign kiya hai — Start Task dabayein.' : 'You are available. Check new requests below.'}
                  </p>
                </div>
                <FaPrayingHands className="absolute right-4 bottom-2 text-white/10 text-8xl" />
              </div>

              {/* ═══ NEW: DAILY LIMIT BANNER (aaj 1 task ho chuka hai) ═══ */}
              {acceptedToday && !isBusy && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <FaHourglassHalf className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-700">
                    Daily limit reached — you can accept only 1 task per day. Come back tomorrow for new requests.
                  </p>
                </div>
              )}

              {/* ===== 1. ASSIGNED TASK (Purple Card + Start Task) ===== */}
              {myAssigned && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-300 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaTasks /> New Task Assigned by Admin</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">Assigned</span>
                  </div>
                  <div className="p-5">
                    <h4 className="text-xl font-extrabold text-gray-900">{myAssigned.serviceType} for {myAssigned.recipientName}</h4>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <FaUserTag /> Sponsor: {myAssigned.sponsor?.firstName} {myAssigned.sponsor?.lastName}
                      {myAssigned.recipientRelation && myAssigned.recipientRelation !== 'N/A' && <span>• Relation: {myAssigned.recipientRelation}</span>}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Your Earning (85%)</p>
                        {isDonation(myAssigned) ? (
                          <p className="text-sm font-extrabold text-purple-700 mt-1 leading-snug">{PRICE_HIDDEN}</p>
                        ) : (
                          <p className="text-lg font-extrabold text-purple-700">PKR {Math.round((myAssigned.price || 0) * 0.85).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Milestones</p>
                        <p className="text-lg font-extrabold text-gray-700">{(myAssigned.milestones || []).length} Steps</p>
                      </div>
                    </div>

                    {myAssigned.reason && myAssigned.reason !== 'N/A' && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Reason for Ibadah</p>
                        <p className="text-sm text-gray-700 italic">"{myAssigned.reason}"</p>
                      </div>
                    )}
                    {myAssigned.notes && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Special Instructions / Dua</p>
                        <p className="text-sm text-gray-700 italic">"{myAssigned.notes}"</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleStartTask(myAssigned._id)}
                      className="mt-5 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold py-3.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
                    >
                      <FaPlay /> Start Task — Milestones Khul Jayenge
                    </button>
                  </div>
                </div>
              )}

              {/* ===== 2. ACTIVE TASK (In Progress - Milestones + Proof) ===== */}
              {myActive && (
                <div className="bg-white rounded-xl shadow-sm border-2 border-green-200">
                  <div className="p-4 border-b border-gray-100 bg-green-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-green-700 flex items-center gap-2"><FaMosque /> Your Active Task</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{myActive.serviceType} for {myActive.recipientName} • Sponsor: {myActive.sponsor?.firstName} {myActive.sponsor?.lastName}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><FaHourglassHalf /> In Progress</span>
                  </div>
                  <div className="p-5">
                    <MilestoneList order={myActive} />
                  </div>
                </div>
              )}

              {/* ===== 3. NEW REQUESTS (Pending) — UPDATED: timing + no price + daily limit ===== */}
              {!isBusy && newRequests.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-red-200">
                  <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <FaBell /> New Task Requests ({newRequests.length})
                    </h3>
                    {acceptedToday && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">Daily Limit Reached</span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {newRequests
                      .filter(o => !searchQuery || `${o.serviceType} ${o.recipientName} ${o.sponsor?.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(order => (
                      <div key={order._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-red-50/40 transition-colors">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-lg font-bold text-gray-900">{order.serviceType}</h4>
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> NEW
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-2"><FaUserTag /> Recipient: {order.recipientName} ({order.recipientRelation || 'N/A'})</p>
                          <p className="text-sm text-gray-500">Sponsor: {order.sponsor?.firstName} {order.sponsor?.lastName}</p>
                          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 pt-0.5">
                            <FaClock className="text-gray-400" /> Requested: {timeAgo(order.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartTask(order._id)}
                          disabled={acceptedToday}
                          title={acceptedToday ? 'Daily limit reached — 1 task per day' : 'Accept this task'}
                          className={`font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm flex-shrink-0 ${
                            acceptedToday
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90 hover:shadow-md'
                          }`}
                        >
                          <FaCheck /> {acceptedToday ? 'Daily Limit Reached' : 'Accept Task'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isBusy && newRequests.filter(o => !searchQuery || `${o.serviceType} ${o.recipientName}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FaTasks className="text-5xl text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No tasks at the moment. Admin assignment ka wait karein.</p>
                 </div>
              )}
            </>
          )}

          {/* ================= HISTORY TAB ================= */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">My Task History</h3>
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-600">{myCompleted.length} Completed</span>
              </div>
              <div className="divide-y divide-gray-100">
                {myCompleted.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">No completed tasks yet. Apna pehla task complete karein!</div>
                ) : myCompleted.map(order => {
                  const prog = milestoneProgress(order);
                  return (
                    <div key={order._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <h4 className="font-bold text-gray-900">{order.serviceType} for {order.recipientName}</h4>
                        <p className="text-xs text-gray-500">Completed: {new Date(order.updatedAt).toLocaleDateString()} • {prog.done}/{prog.total} milestones verified</p>
                      </div>
                      <div className="text-right">
                        {isDonation(order) ? (
                          <span className="text-purple-600 font-bold text-xs block">{PRICE_HIDDEN}</span>
                        ) : (
                          <span className="text-green-600 font-bold text-sm block">PKR {Math.round((order.price || 0) * 0.85).toLocaleString()}</span>
                        )}
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">PAID</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= FEEDBACKS TAB ================= */}
          {activeTab === 'feedbacks' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sponsor Feedbacks</h3>
              {myCompleted.length === 0 ? (
                <p className="text-gray-400 text-sm">Task complete hone par sponsor feedback yahan show hoga.</p>
              ) : (
                <div className="space-y-4">
                  {myCompleted.slice(0, 4).map(order => (
                    <div key={order._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{order.sponsor?.firstName} {order.sponsor?.lastName}</h4>
                        <div className="flex text-yellow-400 text-sm"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
                      </div>
                      <p className="text-sm text-gray-600">Task "{order.serviceType} for {order.recipientName}" — proof videos se tasalli mili. JazakAllah Khair!</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ================= EARNINGS TAB (Real Data) ================= */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] p-6 rounded-xl shadow-sm text-white">
                <p className="text-sm opacity-80">Total Lifetime Earnings (85% share)</p>
                <h3 className="text-4xl font-extrabold mt-2">PKR {totalEarnings.toLocaleString()}</h3>
                {myActive && (
                  <p className="text-sm mt-3 bg-white/10 inline-block px-3 py-1.5 rounded-lg">
                    {isDonation(myActive) ? (
                      <>In Progress: <span className="font-bold text-accent">🔒 Price Hidden</span> (Rules &amp; Regulations apply)</>
                    ) : (
                      <>In Progress: <span className="font-bold text-accent">PKR {pendingEarnings.toLocaleString()}</span> (complete karne par milega)</>
                    )}
                  </p>
                )}
                <button className="mt-4 bg-accent text-dark font-bold px-6 py-2 rounded-lg text-sm hover:bg-yellow-500">Withdraw Funds</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Transaction History (Completed Tasks)</h3>
                {myCompleted.length === 0 ? (
                  <p className="text-gray-400 text-sm">Abhi koi transaction nahi. Task complete karein.</p>
                ) : (
                  <div className="space-y-3">
                    {myCompleted.map(o => (
                      <div key={o._id} className="flex justify-between text-sm border-b pb-2">
                        <span className="text-gray-600">{o.serviceType} — {o.recipientName}</span>
                        {isDonation(o) ? (
                          <span className="font-bold text-purple-600">🔒 Price Hidden</span>
                        ) : (
                          <span className="font-bold text-green-600">+ PKR {Math.round((o.price || 0) * 0.85).toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SETTINGS TAB ================= */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Profile Settings</h3>
              <div className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">First Name</label><input type="text" defaultValue={user?.firstName} className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input type="email" defaultValue={user?.email} className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" /></div>
                <button onClick={() => toast.success('Profile saved!')} className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary/90">Save Changes</button>
              </div>
            </div>
          )}
        </main>

        {/* ================= RIGHT SIDEBAR (Real Stats) ================= */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-20">
            <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Performer Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-gray-500">Total Earnings</span><span className="font-bold text-green-600">PKR {totalEarnings.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Donation Tasks</span><span className="font-bold text-purple-600 text-xs">🔒 Price Hidden</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Tasks Completed</span><span className="font-bold text-gray-800">{myCompleted.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Active Task</span><span className="font-bold text-blue-600">{activeTask ? activeTask.serviceType : 'None'}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Available Status</span><span className={`font-bold ${isBusy ? 'text-red-500' : 'text-green-600'}`}>{isBusy ? 'Busy' : 'Available'}</span></div>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <FaLock className="inline mr-1" />Har milestone ke sath video proof zaroori hai. 5/5 milestones par order khud-ba-khud "Completed" ho jata hai.
              </p>
            </div>
          </div>
        </aside>
      </div>
      
      {/* ================= PROOF MODAL (Professional) ================= */}
      {proofModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !proofSaving && setProofModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><FaVideo /> Complete Milestone</h3>
              <button onClick={() => setProofModal(null)} className="hover:bg-white/20 p-1 rounded-full" disabled={proofSaving}><FaTimesCircle /></button>
            </div>
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Step</p>
                <p className="font-bold text-gray-900">{proofModal.step}</p>
              </div>
              {/* AUTOMATIC LOCATION STATUS (auto-capture chal raha hai) */}
              <div className={`rounded-xl p-3 mb-4 border ${
                locStatus === 'captured' ? 'bg-green-50 border-green-200' :
                locStatus === 'capturing' ? 'bg-blue-50 border-blue-200' :
                locStatus === 'error' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                  <FaMapMarkerAlt className="text-primary" /> Automatic Location
                  {locStatus === 'capturing' && <span className="text-blue-600 normal-case">— capture ho rahi hai...</span>}
                </p>
                {locStatus === 'captured' && proofLocation && (
                  <p className="text-xs text-green-700 font-bold mt-1">
                    ✅ Location Verified: {proofLocation.lat}, {proofLocation.lng}
                  </p>
                )}
                {locStatus === 'capturing' && (
                  <p className="text-xs text-blue-600 mt-1">Browser se GPS coordinates liye ja rahe hain...</p>
                )}
                {locStatus === 'error' && (
                  <p className="text-xs text-amber-700 mt-1">Location nahi mil saki (permission band ya http page). Proof link phir bhi submit ho jayega.</p>
                )}
              </div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Video / Photo Proof Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                autoFocus
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitProof()}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                <FaLink className="mt-0.5 flex-shrink-0" />
                YouTube, Google Drive ya koi bhi proof link paste karein. Sponsor ko yeh link tracking page par nazar aayega.
              </p>

              {/* OCR PROOF VERIFICATION BOX (AI check) */}
              {proofUrl.trim() && looksLikeImage(proofUrl.trim()) && (
                <div className={`rounded-xl p-3 mt-3 border ${
                  ocrStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
                  ocrStatus === 'done' && ocrResult?.suggestion === 'verified' ? 'bg-green-50 border-green-200' :
                  ocrStatus === 'done' && ocrResult?.suggestion === 'weak-match' ? 'bg-amber-50 border-amber-200' :
                  ocrStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                    <FaRobot className="text-blue-600" /> AI Proof Verification (OCR)
                    {ocrStatus === 'checking' && <span className="text-blue-600 normal-case">— receipt scan ho rahi hai...</span>}
                  </p>

                  {ocrStatus === 'checking' && (
                    <p className="text-xs text-blue-600 mt-1">AI image par se text parh raha hai (3-10 seconds)...</p>
                  )}

                  {ocrStatus === 'done' && ocrResult && (
                    <div className="mt-1">
                      <p className={`text-xs font-bold ${
                        ocrResult.suggestion === 'verified' ? 'text-green-700' :
                        ocrResult.suggestion === 'weak-match' ? 'text-amber-700' : 'text-red-600'
                      }`}>
                        {ocrResult.suggestion === 'verified' && '✅ Verified — Receipt keywords mil gaye'}
                        {ocrResult.suggestion === 'weak-match' && '⚠️ Weak match — Admin review karega'}
                        {ocrResult.suggestion === 'manual-review' && '✗ Koi receipt keyword nahi mila — Admin review karega'}
                      </p>
                      {ocrResult.matched?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ocrResult.matched.map((w, i) => (
                            <span key={i} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">✓ {w}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5">Text readability: {ocrResult.confidence}% • Score: {ocrResult.score}</p>
                    </div>
                  )}

                  {ocrStatus === 'error' && (
                    <p className="text-xs text-red-600 mt-1">AI check fail hua — proof phir bhi submit ho sakta hai (Admin manually dekhega).</p>
                  )}

                  {(ocrStatus === 'done' || ocrStatus === 'error') && (
                    <button onClick={() => runOcrCheck(proofUrl.trim())} className="mt-2 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                      <FaSyncAlt /> Phir Se AI Check
                    </button>
                  )}
                </div>
              )}
              {proofUrl.trim() && !looksLikeImage(proofUrl.trim()) && (
                <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                  <FaRobot className="mt-0.5 flex-shrink-0" />
                  AI OCR check sirf image (receipt/photo) links par chalta hai — video links Admin khud verify karte hain.
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setProofModal(null)} disabled={proofSaving} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">Cancel</button>
                <button onClick={submitProof} disabled={proofSaving} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 text-sm flex items-center justify-center gap-2">
                  {proofSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaCheckCircle />} Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= LIVE CHAT ================= */}
      {isChatOpen && (
        <div className="fixed bottom-0 right-0 m-4 w-full max-w-sm bg-white rounded-t-2xl shadow-2xl border border-gray-200 z-50 flex flex-col" style={{ height: '500px' }}>
          <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><h3 className="font-bold">Live Support / Admin</h3></div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><FaTimesCircle /></button>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.sender === 'Me' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'}`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2 bg-white rounded-b-2xl">
            <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:outline-none text-sm" />
            <button type="submit" className="bg-accent text-dark p-2.5 rounded-full hover:bg-yellow-500 transition-colors w-10 h-10 flex items-center justify-center"><FaPaperPlane className="text-sm" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformerDashboard;
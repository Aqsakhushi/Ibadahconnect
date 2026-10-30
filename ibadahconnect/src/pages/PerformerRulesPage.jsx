import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';
import {
  FaArrowLeft, FaScroll, FaSpinner, FaSyncAlt, FaCheckCircle, FaLock,
  FaPrayingHands, FaRegCheckCircle
} from 'react-icons/fa';

// PERFORMER: Rules & Regulations dekhne aur accept karne ka page
const PerformerRulesPage = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreeing, setAgreeing] = useState(false);
  const acceptedAt = localStorage.getItem('rulesAcceptedAt');

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await API.get('/rules');
      setRules(res.data);
    } catch (err) {
      toast.error('Rules load nahi huay. Server check karein.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const handleAgree = () => {
    setAgreeing(true);
    setTimeout(() => {
      localStorage.setItem('rulesAcceptedAt', new Date().toISOString());
      setAgreeing(false);
      toast.success('JazakAllah Khair! Aap ne rules accept kar liye hain. ✅', { duration: 4000 });
    }, 800);
  };

  // Rules text ko lines mein tor kar number lagao (Admin jo bhi likhe)
  const ruleLines = rules?.content
    ? rules.content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    : [];

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 font-outfit pb-20">

      {/* ================= HEADER ================= */}
      <header className="bg-[#1B5E20] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <button onClick={() => navigate('/performer-dashboard')} className="flex items-center gap-2 text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
            <FaArrowLeft /> Dashboard
          </button>
          <h1 className="text-base md:text-lg font-bold tracking-wide flex items-center gap-2">
            <FaScroll className="text-accent" /> Rules & Regulations
          </h1>
          <button onClick={fetchRules} title="Refresh" className="text-base hover:bg-white/10 p-2 rounded-lg">
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ===== Title Card ===== */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] text-white">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                <FaScroll className="text-accent" />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold">{rules?.title || 'Performer Rules & Regulations'}</h2>
                <p className="text-white/70 text-xs mt-1">
                  IbadahConnect Performer Policy • {rules?.updatedAt ? `Updated: ${new Date(rules.updatedAt).toLocaleDateString()}` : 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          {/* ===== Rules List ===== */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <FaSpinner className="animate-spin text-2xl mr-3" /> Rules load ho rahe hain...
              </div>
            ) : (
              <div className="space-y-3">
                {ruleLines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-gray-50 transition-all">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{line.replace(/^\s*\d+[.)]\s*/, '')}</p>
                  </div>
                ))}
                {ruleLines.length === 0 && (
                  <p className="text-gray-400 text-center py-10">Abhi koi rules available nahi.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== Price Privacy Highlight (Donation rule) ===== */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-5 text-white flex items-center gap-4">
          <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-xl flex-shrink-0"><FaLock /></span>
          <div>
            <p className="font-extrabold">Privacy Policy — Donation Orders</p>
            <p className="text-white/80 text-sm mt-0.5">Donation requests ki raqam (amount) performers ko nazar nahi aati. Yeh raqam sirf Admin aur Sponsor ke paas rehti hai — Price Hidden, Rules & Regulations Apply.</p>
          </div>
        </div>

        {/* ===== Agreement Box ===== */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-primary/40 p-6">
          {acceptedAt ? (
            <div className="text-center">
              <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-3" />
              <p className="font-extrabold text-green-700 text-lg">Rules Accepted ✓</p>
              <p className="text-gray-500 text-sm mt-1">Aap ne yeh rules {new Date(acceptedAt).toLocaleString()} par accept kiye the.</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                <FaPrayingHands className="text-primary" /> Allah aap ke mashghala mein barkat de. Ameen.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <FaRegCheckCircle className="text-primary text-4xl mx-auto mb-3" />
              <p className="font-extrabold text-gray-900 text-lg">Kya aap tamam rules parh chuke hain?</p>
              <p className="text-gray-500 text-sm mt-1 mb-5">Task lene se pehle in rules ko accept karna zaroori hai. Yeh record aap ki profile se juda rahega.</p>
              <button
                onClick={handleAgree}
                disabled={agreeing || loading}
                className="bg-primary text-white font-extrabold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mx-auto shadow-lg disabled:opacity-60"
              >
                {agreeing ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                {agreeing ? 'Saving...' : 'Main Ittefaq Karta Hoon — Accept Rules'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PerformerRulesPage;
import { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { FaScroll, FaSave, FaSpinner, FaSyncAlt, FaClock, FaEye, FaLock } from 'react-icons/fa';

// ADMIN: Rules & Regulations upload/edit karne ka page
const AdminRules = () => {
  const [title, setTitle] = useState('Performer Rules & Regulations');
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await API.get('/rules');
      setTitle(res.data.title || 'Performer Rules & Regulations');
      setContent(res.data.content || '');
      setLastUpdated(res.data.updatedAt);
    } catch (err) {
      toast.error('Rules load nahi huay. Server check karein.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Rules ka text likhna zaroori hai.');
      return;
    }
    setSaving(true);
    try {
      const res = await API.put('/rules', { title, content });
      toast.success(res.data.message || 'Rules upload ho gaye!');
      setLastUpdated(res.data.rule?.updatedAt);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rules upload nahi huay.');
    } finally {
      setSaving(false);
    }
  };

  const ruleLines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <FaSpinner className="animate-spin text-2xl mr-3" /> Rules load ho rahe hain...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl"><FaScroll /></span>
            Rules & Regulations Manager
          </h1>
          <p className="text-gray-500 text-sm mt-2">Yahan se performers ke liye rules likhein aur upload karein. Save karte hi Performer Portal mein naye rules nazar aa jayenge.</p>
        </div>
        <button onClick={fetchRules} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT: Editor ===== */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Edit Rules</h3>

          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm font-semibold mb-4"
          />

          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Rules Text <span className="text-red-500">*</span> <span className="text-gray-400 normal-case font-normal">(har rule nayi line par — 1. 2. 3. khud-ba-khud lag jayega)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder={"Har rule nayi line par likhein...\n\nMisal:\nHar milestone ke sath video proof lazmi hai.\nEk waqt mein sirf ek task lein."}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm leading-relaxed"
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-400">{ruleLines.length} rules • {content.length} characters</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? 'Uploading...' : 'Upload Rules'}
            </button>
          </div>

          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
              <FaClock /> Last Updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        {/* ===== RIGHT: Live Preview (jaisa performer dekhega) ===== */}
        <div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><FaEye className="text-primary" /> Live Preview</h3>
            <p className="text-xs text-gray-400 mb-5">Aisi nazar aayega yeh rules Performer Portal mein:</p>

            <div className="bg-[#f0f2f5] rounded-xl p-4 border border-gray-100">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] text-white flex items-center gap-3">
                  <FaScroll className="text-accent text-xl" />
                  <h4 className="font-bold text-sm">{title}</h4>
                </div>
                <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
                  {ruleLines.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">Left side mein rules likhein — preview yahan dikhega.</p>
                  ) : ruleLines.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                      <p className="text-xs text-gray-700 leading-relaxed">{line.replace(/^\s*\d+[.)]\s*/, '')}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-purple-50 border-t border-purple-100 flex items-center gap-2">
                  <FaLock className="text-purple-500 text-xs" />
                  <p className="text-[10px] font-bold text-purple-600">Price Hidden — Rules & Regulations Apply (Donation orders)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRules;
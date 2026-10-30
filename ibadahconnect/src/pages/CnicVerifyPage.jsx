import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Token helper — multiple storage keys support karta hai
function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('ibadah_token') ||
    ''
  );
}

function StatusBadge({ s }) {
  const cls =
    s === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : s === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-300'
    : s === 'Rejected' ? 'bg-red-100 text-red-700 border-red-300'
    : 'bg-gray-100 text-gray-600 border-gray-300';
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>{s}</span>;
}

export default function CnicVerifyPage() {
  const token = getToken();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [cnicNumber, setCnicNumber] = useState('');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/auth/cnic/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) setErr(data.message || 'Failed to load CNIC status.');
      else setStatus(data);
    } catch {
      setErr('Cannot reach server. Is the backend running?');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadStatus();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickImage = (e, setFile, setPreview) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!frontFile || !backFile) {
      setErr('Please upload both CNIC front and back images.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('cnicNumber', cnicNumber);
      fd.append('cnicFront', frontFile);
      fd.append('cnicBack', backFile);
      const res = await fetch('/api/auth/cnic/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.message || 'Upload failed.');
      } else {
        setMsg(data.message || 'CNIC submitted successfully!');
        setFrontFile(null); setBackFile(null);
        setFrontPreview(''); setBackPreview(''); setCnicNumber('');
        loadStatus();
      }
    } catch {
      setErr('Upload failed. Is the backend running?');
    }
    setSubmitting(false);
  };

  const dark = 'min-h-screen bg-gradient-to-b from-[#04241b] via-[#0a3226] to-[#04241b] flex items-center justify-center p-4';

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className={dark}>
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---------- Not logged in ----------
  if (!token) {
    return (
      <div className={dark}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[#1B5E20] mb-2">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in to verify your CNIC.</p>
          <Link to="/login" className="inline-block bg-[#1B5E20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#14491a] transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const cnicStatus = status ? status.cnicStatus : 'Unverified';
  const isPerformer = status ? status.role === 'Performer' : true;
  const showForm = cnicStatus === 'Unverified' || cnicStatus === 'Rejected';

  return (
    <div className={dark}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xl font-extrabold">
            <span className="text-[#1B5E20]">Ibadah</span>
            <span className="text-[#D4AF37]">Connect</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-3">CNIC Verification</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload your CNIC so the admin can verify your identity.
          </p>
        </div>

        {/* Current status */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
          <span className="text-sm text-gray-600 font-medium">Current Status</span>
          <StatusBadge s={cnicStatus} />
        </div>

        {/* Verified card */}
        {cnicStatus === 'Verified' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-emerald-800 text-lg">CNIC Verified</h2>
            <p className="text-emerald-700 text-sm mt-1">
              Your identity is confirmed. CNIC: {status?.cnicNumber || '—'}
            </p>
          </div>
        )}

        {/* Pending card */}
        {cnicStatus === 'Pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <h2 className="font-bold text-amber-800 text-lg">Under Review</h2>
            <p className="text-amber-700 text-sm mt-1">
              Your CNIC has been submitted. The admin will verify it soon.
            </p>
            <p className="text-amber-700 text-sm">CNIC: {status?.cnicNumber || '—'}</p>
          </div>
        )}

        {/* Rejected reason */}
        {cnicStatus === 'Rejected' && status?.cnicRejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <h2 className="font-bold text-red-700 text-sm">Rejected — Reason:</h2>
            <p className="text-red-600 text-sm mt-1">{status.cnicRejectionReason}</p>
          </div>
        )}

        {/* Role note */}
        {!isPerformer && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-600 text-sm mb-5">
            Only Performer accounts can submit CNIC verification.
          </div>
        )}

        {/* Upload form */}
        {isPerformer && showForm && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* CNIC number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CNIC Number</label>
              <input
                type="text"
                value={cnicNumber}
                onChange={(e) => setCnicNumber(e.target.value)}
                placeholder="35202-1234567-8"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent"
              />
            </div>

            {/* Front image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CNIC Front Image</label>
              <label className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#1B5E20] transition">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e, setFrontFile, setFrontPreview)} />
                {frontPreview ? (
                  <img src={frontPreview} alt="CNIC front preview" className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <span className="text-gray-500 text-sm">Click to select front side photo (JPG/PNG, max 5MB)</span>
                )}
              </label>
            </div>

            {/* Back image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CNIC Back Image</label>
              <label className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#1B5E20] transition">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e, setBackFile, setBackPreview)} />
                {backPreview ? (
                  <img src={backPreview} alt="CNIC back preview" className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <span className="text-gray-500 text-sm">Click to select back side photo (JPG/PNG, max 5MB)</span>
                )}
              </label>
            </div>

            {err && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{err}</div>}
            {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">{msg}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1B5E20] text-white py-3 rounded-lg font-bold hover:bg-[#14491a] transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit for Verification'}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[#1B5E20] font-medium hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
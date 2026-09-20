import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('ibadah_token') ||
    ''
  );
}

// Auth-protected image: token ke sath blob fetch karke show karta hai
function AuthImage({ filename, token, label }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = '';
    (async () => {
      try {
        const res = await fetch(`/api/auth/cnic/image/${filename}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { setFailed(true); return; }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        setFailed(true);
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [filename]);

  if (failed) {
    return (
      <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400 text-sm">
        {label} not available
      </div>
    );
  }
  if (!src) {
    return (
      <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }
  return <img src={src} alt={label} className="rounded-lg w-full h-40 object-cover border border-gray-200" />;
}

function Badge({ s }) {
  const cls =
    s === 'Verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : s === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-red-100 text-red-700 border-red-300';
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>{s}</span>;
}

export default function AdminCnicPanel() {
  const navigate = useNavigate();
  const token = getToken();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/cnic/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) setErr(data.message || 'Failed to load submissions.');
      else setSubs(Array.isArray(data) ? data : []);
    } catch {
      setErr('Cannot reach server. Is the backend running?');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleVerify = async (id) => {
    setBusyId(id); setActionMsg('');
    try {
      const res = await fetch(`/api/auth/cnic/admin/verify/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setActionMsg(data.message || 'Done.');
      load();
    } catch {
      setActionMsg('Action failed.');
    }
    setBusyId('');
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection (performer ko dikhega):');
    if (reason === null) return; // user ne cancel kiya
    setBusyId(id); setActionMsg('');
    try {
      const res = await fetch(`/api/auth/cnic/admin/reject/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      setActionMsg(data.message || 'Done.');
      load();
    } catch {
      setActionMsg('Action failed.');
    }
    setBusyId('');
  };

  const pendingCount = subs.filter((s) => s.cnicStatus === 'Pending').length;
  const verifiedCount = subs.filter((s) => s.cnicStatus === 'Verified').length;
  const rejectedCount = subs.filter((s) => s.cnicStatus === 'Rejected').length;

  return (
    <div className="min-h-screen bg-[#f4f6f4]">
      {/* Header */}
      <div className="bg-[#1B5E20] text-white">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold">
              <span className="text-white">Ibadah</span>
              <span className="text-[#D4AF37]">Connect</span>
              <span className="ml-3 text-sm font-medium text-emerald-100">Admin — CNIC Verification</span>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Counts */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{verifiedCount}</div>
            <div className="text-sm text-gray-500">Verified</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{rejectedCount}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>

        {actionMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
            {actionMsg}
          </div>
        )}
        {err && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {err}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading submissions…</div>
        ) : subs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            No CNIC submissions yet. Performers will appear here after they submit.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {subs.map((s) => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{s.firstName} {s.lastName}</h3>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <Badge s={s.cnicStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div><span className="font-semibold">CNIC:</span> {s.cnicNumber || '—'}</div>
                    <div><span className="font-semibold">City:</span> {s.city || '—'}</div>
                    <div><span className="font-semibold">Type:</span> {s.performerType || '—'}</div>
                    <div><span className="font-semibold">Updated:</span> {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '—'}</div>
                  </div>

                  {s.cnicStatus === 'Rejected' && s.cnicRejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 mb-3">
                      Reason: {s.cnicRejectionReason}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {s.cnicFrontImage ? (
                      <AuthImage filename={s.cnicFrontImage} token={token} label="Front" />
                    ) : (
                      <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400 text-sm">No front image</div>
                    )}
                    {s.cnicBackImage ? (
                      <AuthImage filename={s.cnicBackImage} token={token} label="Back" />
                    ) : (
                      <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center text-gray-400 text-sm">No back image</div>
                    )}
                  </div>

                  {s.cnicStatus === 'Pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerify(s._id)}
                        disabled={busyId === s._id}
                        className="flex-1 bg-[#1B5E20] text-white py-2.5 rounded-lg font-semibold hover:bg-[#14491a] transition disabled:opacity-50"
                      >
                        {busyId === s._id ? 'Working…' : 'Verify'}
                      </button>
                      <button
                        onClick={() => handleReject(s._id)}
                        disabled={busyId === s._id}
                        className="flex-1 border-2 border-red-300 text-red-600 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
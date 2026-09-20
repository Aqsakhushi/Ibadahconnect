import { useState, useEffect } from 'react';
import API from '../api/axios';
import { getCurrentUser } from '../utils/auth';
import toast from 'react-hot-toast';
import { FaDownload, FaCheckCircle, FaTimes, FaReceipt, FaLock, FaSpinner } from 'react-icons/fa';

const PAY_BADGE = {
  Unpaid: 'bg-gray-100 text-gray-600',
  Paid: 'bg-emerald-100 text-emerald-700',
  'Under Review': 'bg-amber-100 text-amber-700',
};

export default function AdminPayments() {
  const current = getCurrentUser();
  const isAdmin = String(current?.role || '').toLowerCase() === 'admin';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Under Review');
  const [busy, setBusy] = useState('');

  const load = async () => {
    try {
      const r = await API.get('/orders');
      setOrders(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, []);

  const verify = async (code, action) => {
    setBusy(code + action);
    try {
      await API.put(`/payments/verify/${code}`, { action });
      toast.success(action === 'approve' ? 'Payment verified — marked as Paid' : 'Payment rejected');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setBusy('');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 text-2xl"><FaLock /></div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Admin Access Only</h1>
          <p className="text-sm text-gray-500">Please login with an administrator account to review payments.</p>
        </div>
      </div>
    );
  }

  const list = orders
    .filter((o) => o.paymentMethod === 'Bank Transfer' || o.paymentStatus === 'Under Review' || o.receiptUrl)
    .filter((o) => (filter === 'All' ? true : o.paymentStatus === filter));

  return (
    <div className="min-h-screen bg-[#f5f7f6] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1 flex items-center gap-2"><FaReceipt className="text-emerald-700" /> Payment Verification</h1>
        <p className="text-sm text-gray-500 mb-6">Review bank transfer receipts, download screenshots and verify payments.</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['Under Review', 'Paid', 'Unpaid', 'All'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-bold px-4 py-2 rounded-full border transition ${filter === f ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-500'}`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16"><FaSpinner className="text-3xl text-emerald-700 animate-spin mx-auto" /></div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-14">
            <FaReceipt className="text-5xl text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No payments in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {list.map((o) => (
              <div key={o._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {o.receiptUrl ? (
                  <img src={o.receiptUrl} alt="receipt" className="w-full h-48 object-cover border-b" />
                ) : (
                  <div className="w-full h-24 bg-gray-50 flex items-center justify-center text-gray-300 text-sm font-semibold">No receipt uploaded</div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono font-bold text-emerald-900 text-sm">{o.orderCode || '—'}</p>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PAY_BADGE[o.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>{o.paymentStatus || 'Unpaid'}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{o.packageTitle || o.serviceTitle || o.serviceType}</p>
                  <p className="text-xs text-gray-500">
                    {o.sponsor && typeof o.sponsor === 'object' ? `${o.sponsor.firstName || ''} ${o.sponsor.lastName || ''}` : 'Sponsor'} · Rs {(o.price || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">Ref: {o.paymentRef || '—'}</p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {o.receiptUrl && (
                      <a href={o.receiptUrl} target="_blank" download className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-gray-800 inline-flex items-center gap-2"><FaDownload /> Download</a>
                    )}
                    {o.paymentStatus !== 'Paid' && (
                      <button onClick={() => verify(o.orderCode, 'approve')} disabled={busy === o.orderCode + 'approve'}
                        className="bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-800 disabled:opacity-50 inline-flex items-center gap-2"><FaCheckCircle /> Verify</button>
                    )}
                    {o.paymentStatus === 'Under Review' && (
                      <button onClick={() => verify(o.orderCode, 'reject')} disabled={busy === o.orderCode + 'reject'}
                        className="border border-red-200 text-red-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-2"><FaTimes /> Reject</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
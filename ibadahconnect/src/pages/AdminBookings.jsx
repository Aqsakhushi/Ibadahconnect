import { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { FaSearch, FaBoxOpen, FaEye, FaTimes, FaUser, FaMapMarkerAlt, FaPhone, FaGift, FaClipboardList, FaMosque, FaUserPlus, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaReceipt, FaSpinner } from 'react-icons/fa';

const API_BASE = (API.defaults && API.defaults.baseURL ? API.defaults.baseURL : 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const receiptSrc = (url) => (!url ? '' : (url.startsWith('data:') || url.startsWith('http')) ? url : `${API_BASE}${url}`);

const PAY_CHIP = {
  Paid: 'bg-green-50 text-green-600 border-green-200',
  'Under Review': 'bg-amber-50 text-amber-600 border-amber-200',
  Unpaid: 'bg-red-50 text-red-500 border-red-200',
};

const AdminBookings = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewOrder, setViewOrder] = useState(null);
  const [performers, setPerformers] = useState([]);
  const [assignOrder, setAssignOrder] = useState(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('/orders/all');
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        console.log("Error fetching orders");
        setLoading(false);
      }
    };
    const fetchPerformers = async () => {
      try {
        const res = await API.get('/auth/performers');
        setPerformers(res.data);
      } catch (err) {
        console.log("Error fetching performers");
      }
    };
    fetchOrders();
    fetchPerformers();
  }, []);

  const handleAssign = async (performerId, performerName) => {
    try {
      await API.put(`/orders/assign/${assignOrder._id}`, { performerId });
      toast.success(`${performerName} assigned successfully!`);
      const res = await API.get('/orders/all');
      setOrders(res.data);
      setAssignOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error assigning performer");
    }
  };

  const handlePaymentStatus = async (ord, paymentStatus) => {
    setPayBusy(true);
    try {
      await API.put(`/payments-admin/${ord._id}`, { paymentStatus });
      toast.success(paymentStatus === 'Paid' ? 'Payment confirmed — order marked Paid!' : 'Payment rejected — order marked Unpaid.');
      const res = await API.get('/orders/all');
      setOrders(res.data);
      setViewOrder((v) => (v ? { ...v, paymentStatus } : v));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment update failed');
    } finally {
      setPayBusy(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.sponsor?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sponsor?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sponsor?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.packageTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-center py-10 text-gray-500">Loading bookings...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">View Bookings</h1>
          <p className="text-gray-500 text-sm">A list of all proxy worship orders and donations.</p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search sponsor, recipient or package..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-primary text-sm shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        {['All', 'Pending', 'Assigned', 'In Progress', 'Completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors relative -mb-px ${
              filterStatus === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {tab === 'All' ? orders.length : orders.filter(o => o.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-semibold tracking-wider">Sponsor</th>
                <th className="py-4 px-6 font-semibold tracking-wider hidden md:table-cell">Recipient</th>
                <th className="py-4 px-6 font-semibold tracking-wider">Service</th>
                <th className="py-4 px-6 font-semibold tracking-wider hidden lg:table-cell">Date</th>
                <th className="py-4 px-6 font-semibold tracking-wider">Amount</th>
                <th className="py-4 px-6 font-semibold tracking-wider">Status</th>
                <th className="py-4 px-6 font-semibold tracking-wider">Payment</th>
                <th className="py-4 px-6 font-semibold tracking-wider hidden xl:table-cell">Performer</th>
                <th className="py-4 px-6 font-semibold tracking-wider text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <FaBoxOpen className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No bookings found for this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => (
                  <tr key={ord._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {ord.sponsor?.firstName ? ord.sponsor.firstName[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{ord.sponsor?.firstName} {ord.sponsor?.lastName}</p>
                          <p className="text-xs text-gray-500">{ord.sponsor?.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="font-medium text-gray-800">{ord.recipientName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{ord.recipientRelation || ''}{ord.beneficiaryGender ? ` • ${ord.beneficiaryGender}` : ''}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {ord.packageTitle || ord.serviceType}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{ord.serviceType}</p>
                    </td>

                    <td className="py-4 px-6 text-gray-500 text-xs hidden lg:table-cell">
                      {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="py-4 px-6 font-bold text-gray-900">PKR {ord.price.toLocaleString()}</td>

                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        ord.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                        ord.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        ord.status === 'Assigned' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        'bg-yellow-50 text-yellow-600 border-yellow-200'
                      }`}>
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${PAY_CHIP[ord.paymentStatus] || PAY_CHIP.Unpaid}`}>
                        {ord.paymentStatus || 'Unpaid'}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-1">{ord.paymentMethod || '—'}</p>
                    </td>

                    <td className="py-4 px-6 hidden xl:table-cell">
                      {ord.performer && typeof ord.performer === 'object' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {ord.performer.firstName ? ord.performer.firstName[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{ord.performer.firstName} {ord.performer.lastName}</p>
                            <p className="text-[10px] text-green-600 font-semibold">Assigned</p>
                          </div>
                        </div>
                      ) : ord.status === 'Completed' ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          onClick={() => setAssignOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-colors"
                        >
                          <FaUserPlus /> Assign
                        </button>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setViewOrder(ord)}
                        title={ord.paymentStatus === 'Under Review' ? 'Review Payment Receipt' : 'View Full Booking Details'}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                          ord.paymentStatus === 'Under Review'
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white animate-pulse'
                            : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'
                        }`}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ ASSIGN PERFORMER MODAL ============ */}
      {assignOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setAssignOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FaUserPlus className="text-primary" /> Assign Performer</h2>
                <p className="text-xs text-gray-500 mt-0.5">{assignOrder.packageTitle || assignOrder.serviceType} — {assignOrder.recipientName}</p>
              </div>
              <button onClick={() => setAssignOrder(null)} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"><FaTimes /></button>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search performer by name..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full px-4 py-2.5 mb-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary text-sm"
              />
              {performers.length === 0 ? (
                <div className="text-center py-10">
                  <FaUserPlus className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Koi performer registered nahi hai abhi.</p>
                  <p className="text-gray-400 text-xs mt-1">Pehle koi user Performer role se signup kare.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {performers
                    .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(assignSearch.toLowerCase()))
                    .map(p => (
                      <div key={p._id} className={`flex items-center justify-between p-3 rounded-xl border ${p.isVerified ? 'border-gray-200 hover:border-primary/50 hover:bg-primary/5' : 'border-gray-100 bg-gray-50 opacity-60'} transition-colors`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {p.firstName ? p.firstName[0].toUpperCase() : 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              {p.firstName} {p.lastName}
                              {p.isVerified ? <FaCheckCircle className="text-green-500 text-xs" title="Verified" /> : <FaTimesCircle className="text-red-400 text-xs" title="Not Verified" />}
                            </p>
                            <p className="text-xs text-gray-500">{p.email}</p>
                            {!p.isVerified && <p className="text-[10px] text-red-500 font-semibold">Pehle Performers page se verify karein</p>}
                          </div>
                        </div>
                        <button
                          disabled={!p.isVerified}
                          onClick={() => handleAssign(p._id, p.firstName)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold ${p.isVerified ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ FULL DETAILS MODAL ============ */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-start z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaClipboardList className="text-primary" /> Booking Details
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Placed on {new Date(viewOrder.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => setViewOrder(null)} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <FaTimes />
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Selected Package</p>
                  <p className="font-bold text-gray-900 text-lg">{viewOrder.packageTitle || '—'}</p>
                  <p className="text-sm text-gray-500">{viewOrder.serviceType}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment</p>
                  <p className="font-bold text-gray-900">PKR {viewOrder.price?.toLocaleString()}</p>
                  <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold border ${PAY_CHIP[viewOrder.paymentStatus] || PAY_CHIP.Unpaid}`}>
                    {viewOrder.paymentStatus || 'Unpaid'}
                  </span>
                  {viewOrder.hadiyah > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Incl. Hadiyah: PKR {viewOrder.hadiyah.toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* ===== PAYMENT & RECEIPT VERIFICATION ===== */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2"><FaMoneyBillWave className="text-primary text-xs" /> Payment & Receipt Verification</h3>
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                    <Detail label="Method" value={viewOrder.paymentMethod || '—'} />
                    <Detail label="Status" value={viewOrder.paymentStatus || 'Unpaid'} />
                    <Detail label="Reference" value={viewOrder.paymentRef || '—'} />
                    <Detail label="Paid At" value={viewOrder.paidAt ? new Date(viewOrder.paidAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'} />
                  </div>

                  {viewOrder.receiptUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FaReceipt /> Receipt Screenshot (click to full view)</p>
                      <a href={receiptSrc(viewOrder.receiptUrl)} target="_blank" rel="noreferrer">
                        <img src={receiptSrc(viewOrder.receiptUrl)} alt="Receipt" className="max-h-72 rounded-xl border border-gray-200 object-contain bg-gray-50 cursor-zoom-in" />
                      </a>
                    </div>
                  )}

                  {viewOrder.paymentStatus === 'Under Review' ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => handlePaymentStatus(viewOrder, 'Paid')} disabled={payBusy} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors">
                        {payBusy ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Confirm Payment (Mark Paid)
                      </button>
                      <button onClick={() => handlePaymentStatus(viewOrder, 'Unpaid')} disabled={payBusy} className="flex-1 bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 inline-flex items-center justify-center gap-2 transition-colors">
                        <FaTimesCircle /> Reject (Mark Unpaid)
                      </button>
                    </div>
                  ) : viewOrder.paymentStatus === 'Paid' ? (
                    <p className="text-xs font-bold text-green-600 flex items-center gap-1.5"><FaCheckCircle /> Payment verified{viewOrder.paymentMethod === 'JazzCash' ? ' automatically via JazzCash' : ' by Admin'}.</p>
                  ) : (
                    <p className="text-xs text-gray-400">No receipt submitted yet — waiting for sponsor payment.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2"><FaUser className="text-primary text-xs" /> Sponsor (Account Holder)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-white border border-gray-200 rounded-xl p-5">
                  <Detail label="Name" value={`${viewOrder.sponsor?.firstName || ''} ${viewOrder.sponsor?.lastName || ''}`} />
                  <Detail label="Email" value={viewOrder.sponsor?.email} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2"><FaPhone className="text-primary text-xs" /> Requestor Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-white border border-gray-200 rounded-xl p-5">
                  <Detail label="Phone" value={viewOrder.requestorPhone || 'Not provided'} />
                  <Detail label="Country" value={viewOrder.requestorAddress?.country || ''} />
                  <div className="md:col-span-2">
                    <Detail
                      label="Street Address"
                      icon={<FaMapMarkerAlt />}
                      value={[viewOrder.requestorAddress?.street, viewOrder.requestorAddress?.city, viewOrder.requestorAddress?.state, viewOrder.requestorAddress?.zip].filter(Boolean).join(', ') || 'Not provided'}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2"><FaMosque className="text-primary text-xs" /> Beneficiary (On whose behalf Ibadah is done)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 bg-white border border-gray-200 rounded-xl p-5">
                  <Detail label="Full Name" value={viewOrder.recipientName} />
                  <Detail label="Relationship" value={viewOrder.recipientRelation} />
                  <Detail label="Gender" value={viewOrder.beneficiaryGender || 'N/A'} />
                </div>
              </div>

              {(viewOrder.reason || viewOrder.notes) && (
                <div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">Reason & Special Instructions</h3>
                  <div className="space-y-3">
                    {viewOrder.reason && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Reason for Badal</p>
                        <p className="text-gray-700 text-sm">{viewOrder.reason}</p>
                      </div>
                    )}
                    {viewOrder.notes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Notes / Special Duas</p>
                        <p className="text-gray-700 text-sm">{viewOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewOrder.hadiyah > 0 && (
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <FaGift className="text-purple-500" />
                  <p className="text-sm text-gray-700">
                    Sponsor ne performer ke liye <b>Hadiyah PKR {viewOrder.hadiyah.toLocaleString()}</b> di hai.
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <p className="text-xs text-gray-400">Order ID: {viewOrder._id}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  viewOrder.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' :
                  viewOrder.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-yellow-50 text-yellow-600 border-yellow-200'
                }`}>
                  Status: {viewOrder.status}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, icon }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
      {icon}{label}
    </p>
    <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{value || '—'}</p>
  </div>
);

export default AdminBookings;
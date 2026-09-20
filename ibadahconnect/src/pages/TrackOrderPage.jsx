import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';
import {
  FaCheckCircle, FaCircle, FaMosque, FaUserCircle, FaVideo, FaExternalLinkAlt,
  FaBoxOpen, FaGift, FaHourglassHalf, FaTrophy, FaUserCheck, FaArrowLeft, FaMapMarkerAlt,
  FaPhone, FaRegClock, FaLock, FaPlayCircle, FaRobot
} from 'react-icons/fa';

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/detail/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        setError('Order nahi mila. Shayad galat link hai.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    // Live tracking feel: har 10 second refresh
    const timer = setInterval(fetchOrder, 10000);
    return () => clearInterval(timer);
  }, [orderId]);

  const statusFlow = ['Pending', 'Assigned', 'In Progress', 'Completed'];
  const statusStep = order ? statusFlow.indexOf(order.status) : 0;
  const doneMilestones = order ? (order.milestones || []).filter(m => m.isCompleted).length : 0;
  const totalMilestones = order ? (order.milestones || []).length : 0;
  const progressPct = totalMilestones ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  const StatusPill = ({ status }) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Assigned': 'bg-purple-100 text-purple-700 border-purple-200',
      'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200'
    };
    return <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${styles[status]}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Loading your order tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12">
          <FaLock className="text-5xl text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/dashboard" className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 inline-flex items-center gap-2">
            <FaArrowLeft /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <Link to="/dashboard" className="text-primary text-sm font-bold hover:underline flex items-center gap-1.5 mb-2">
            <FaArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Track Your Order</h1>
          <p className="text-gray-400 text-xs mt-1">Order ID: {order._id}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      {/* Status Stepper */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-5 right-5 top-5 h-1 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${(statusStep / 3) * 100}%` }}></div>
          </div>
          {statusFlow.map((s, idx) => (
            <div key={s} className="relative z-10 flex flex-col items-center text-center" style={{ width: '25%' }}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 shadow-sm ${
                idx < statusStep ? 'bg-green-500 border-green-100 text-white' :
                idx === statusStep ? 'bg-primary border-green-100 text-white animate-pulse' :
                'bg-gray-200 border-gray-50 text-gray-400'
              }`}>
                {idx < statusStep ? <FaCheckCircle /> : idx === statusStep ? <FaHourglassHalf className="text-sm" /> : <FaCircle className="text-[8px]" />}
              </div>
              <span className={`mt-2 text-[10px] md:text-xs font-bold ${idx <= statusStep ? 'text-gray-800' : 'text-gray-400'}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Milestone Timeline (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Progress Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><FaMosque className="text-primary" /> Ibadah Progress</h2>
              <span className="text-sm font-extrabold text-primary">{doneMilestones} / {totalMilestones} Steps</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
            </div>
            <p className="text-xs text-gray-400">{progressPct}% complete — har step ka video proof neeche attach hai.</p>

            {/* Milestone Timeline */}
            <div className="mt-6 space-y-0">
              {(order.milestones || []).map((m, idx) => {
                const isLast = idx === (order.milestones || []).length - 1;
                return (
                  <div key={idx} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        m.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}>
                        {m.isCompleted ? <FaCheckCircle /> : idx + 1}
                      </div>
                      {!isLast && <div className={`w-0.5 flex-1 min-h-[40px] ${m.isCompleted ? 'bg-green-300' : 'bg-gray-200'}`}></div>}
                    </div>
                    {/* Content */}
                    <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`font-bold ${m.isCompleted ? 'text-green-700' : 'text-gray-400'}`}>{m.step}</p>
                      {m.isCompleted ? (
                        m.proofUrl ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <a href={m.proofUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                              <FaPlayCircle /> Watch Proof Video <FaExternalLinkAlt className="text-[9px]" />
                            </a>
                            {m.proofLocation && (
                              <a href={`https://www.google.com/maps?q=${m.proofLocation.lat},${m.proofLocation.lng}`} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                                <FaMapMarkerAlt /> Location Verified <FaExternalLinkAlt className="text-[9px]" />
                              </a>
                            )}
                                                        {m.proofOcr?.suggestion === 'verified' && (
                              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-xl text-xs font-bold">
                                <FaRobot /> AI Verified (OCR Score {m.proofOcr.score})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="mt-2 inline-block text-xs text-green-600 bg-green-50 px-3 py-1 rounded-lg">Completed (proof jald upload hoga)</span>
                        )
                      ) : (
                        <span className="mt-2 inline-block text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                          {order.status === 'Pending' ? 'Performer assign hone ke baad shuru hoga' : 'Performer complete hone par yahan video aayega'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completed Celebration */}
            {order.status === 'Completed' && (
              <div className="mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 flex items-center gap-3 text-white">
                <FaTrophy className="text-3xl" />
                <div>
                  <p className="font-extrabold">Ibadah Mukammal! 🎉</p>
                  <p className="text-xs opacity-90">Aap ki beh nami ke liye saare milestones perform ho chuke hain. JazakAllah Khair!</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><FaBoxOpen className="text-primary" /> Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Package</p>
                <p className="font-bold text-gray-800">{order.packageTitle || order.serviceType}</p>
                <p className="text-xs text-gray-400">{order.serviceType}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Beneficiary (Marhoom/Marhooma)</p>
                <p className="font-bold text-gray-800">{order.recipientName}</p>
                <p className="text-xs text-gray-400">{order.recipientRelation || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment</p>
                <p className="font-bold text-gray-800">PKR {(order.price || 0).toLocaleString()}</p>
                {order.hadiyah > 0 && <p className="text-xs text-green-600">includes Hadiyah PKR {order.hadiyah.toLocaleString()}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><FaRegClock className="inline mr-1" />Booked On</p>
                <p className="font-bold text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Your Special Dua / Notes</p>
                <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Performer Card (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-[#1B5E20] to-[#0a3a20]"></div>
            <div className="px-5 pb-5 -mt-10">
              {order.performer ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-green-800 border-4 border-white flex items-center justify-center text-white text-2xl font-extrabold shadow-md">
                    {order.performer.firstName ? order.performer.firstName[0].toUpperCase() : 'P'}
                  </div>
                  <h3 className="font-extrabold text-gray-900 mt-3 text-lg">{order.performer.firstName} {order.performer.lastName}</h3>
                  <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                    <FaUserCheck /> Verified Performer
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{order.performer.email}</p>
                  <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Currently</p>
                    <p className="text-sm font-bold text-gray-800">
                      {order.status === 'Assigned' && 'Task assigned — jald start karein ge'}
                      {order.status === 'In Progress' && `Ibadah jaari hai (${doneMilestones}/${totalMilestones} steps done)`}
                      {order.status === 'Completed' && 'Ibadah mukammal kar chuke hain'}
                      {order.status === 'Pending' && 'Waiting'}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <p className="text-lg font-extrabold text-primary">{doneMilestones}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Steps Done</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <p className="text-lg font-extrabold text-primary">{totalMilestones - doneMilestones}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Remaining</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <FaUserCircle className="text-6xl text-gray-200 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-700">Performer Assign Hona Hai</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Admin jald hi ek verified performer assign kare ga. Us ke baad yahan performer ki details aur live progress nazar aayegi.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hadiyah Note */}
          {order.hadiyah > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2 text-sm"><FaGift className="text-accent" /> Hadiyah (Gift)</h3>
              <p className="text-sm text-gray-600">Aap ne performer ke liye <span className="font-bold text-green-600">PKR {order.hadiyah.toLocaleString()}</span> hadiyah bheja hai. JazakAllah Khair!</p>
            </div>
          )}

          {/* Trust Note */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2 text-sm"><FaLock className="text-primary" /> 100% Transparent</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Har milestone par video proof upload hota hai jo aap upar timeline se dekh sakte hain. GPS location verification ke sath — 100% Shariah-compliant aur transparent system.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
import { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import {
  FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUserCheck, FaIdCard,
  FaTrash, FaCalendarAlt, FaMosque, FaUsers, FaStar, FaHandshake, FaBuilding, FaHourglassHalf,
  FaEye, FaLink, FaGlobe
} from 'react-icons/fa';

const AdminPerformers = () => {
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null); // delete confirmation popup
  const [agencyInput, setAgencyInput] = useState({}); // { performerId: { name, website } }
  const [agencyBusy, setAgencyBusy] = useState('');

  useEffect(() => {
    fetchPerformers();
  }, []);

  const fetchPerformers = async () => {
    try {
      const res = await API.get('/auth/performers');
      setPerformers(res.data);
      setLoading(false);
    } catch (err) {
      console.log("Error fetching performers");
      setLoading(false);
    }
  };

  const handleVerify = async (id, isVerified = true) => {
    try {
      await API.put(`/auth/verify-performer/${id}`, { isVerified });
      setPerformers(performers.map(p => p._id === id ? { ...p, isVerified } : p));
      toast.success(isVerified ? "Performer verified successfully!" : "Verification removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error verifying performer.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/auth/user/${id}`);
      setPerformers(performers.filter(p => p._id !== id));
      setDeleteId(null);
      toast.success("Performer removed from platform.");
    } catch (err) {
      toast.error("Error deleting performer.");
    }
  };

  // AGENCY CONNECT (Self/Family performers — Admin enters agency NAME + WEBSITE)
  const setAgencyField = (id, field, value) => {
    setAgencyInput(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const handleAgencyConnect = async (id) => {
    const name = ((agencyInput[id] || {}).name || '').trim();
    const website = ((agencyInput[id] || {}).website || '').trim();
    if (!name) { toast.error('Please enter the agency name.'); return; }
    setAgencyBusy(id);
    try {
      const res = await API.put(`/auth/agency-connect/${id}`, { agencyName: name, agencyWebsite: website, action: 'connect' });
      setPerformers(performers.map(p => p._id === id ? { ...p, agencyConnect: 'Connected', agencyName: name, agencyWebsite: res.data.agencyWebsite || website } : p));
      toast.success(res.data.message || 'Agency connected!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Agency connection failed.');
    } finally {
      setAgencyBusy('');
    }
  };

  const handleAgencyReject = async (id) => {
    setAgencyBusy(id);
    try {
      const res = await API.put(`/auth/agency-connect/${id}`, { action: 'reject' });
      setPerformers(performers.map(p => p._id === id ? { ...p, agencyConnect: 'None', agencyName: '', agencyWebsite: '' } : p));
      toast.success(res.data.message || 'Request rejected.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed.');
    } finally {
      setAgencyBusy('');
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading performer requests...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Performer Verification</h1>
          <p className="text-gray-500 text-sm">Review profile pic, Umrah proof and agency requests, then approve.</p>
        </div>
        <span className="bg-primary/10 text-primary text-sm font-bold px-4 py-2 rounded-xl">
          Total: {performers.length}
        </span>
      </div>

      {performers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <FaUserCheck className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No performer requests yet.</p>
          <p className="text-gray-400 text-sm mt-1">Anyone who signs up with the Performer role will appear here with complete details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {performers.map(req => (
            <div key={req._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">

              {/* Top Profile Section (PIC + TYPE BADGE) */}
              <div className="p-5 flex items-start justify-between border-b border-gray-100">
                <div className="flex items-center gap-4">
                  {req.profilePic ? (
                    <img src={req.profilePic} alt={`${req.firstName} profile`} className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
                      {req.firstName ? req.firstName[0].toUpperCase() : 'P'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {req.firstName} {req.lastName}
                    </h3>
                    {/* PERFORMER TYPE BADGE */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${req.performerType === 'Self/Family' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {req.performerType === 'Self/Family' ? <FaUsers /> : <FaMosque />} {req.performerType || 'Ibadah Team'}
                    </span>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FaMapMarkerAlt className="text-gray-400" /> {req.country || 'N/A'}
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <FaCalendarAlt className="text-gray-300" /> Joined: {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  req.isVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {req.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>

              {/* Details Section - Complete Information */}
              <div className="p-5 bg-gray-50/50 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Complete Details</h4>
                <p className="text-sm text-gray-700 flex items-center gap-2"><FaPhone className="text-gray-400 w-4" /> {req.phone || 'N/A'}</p>
                <p className="text-sm text-gray-700 flex items-center gap-2"><FaEnvelope className="text-gray-400 w-4" /> {req.email}</p>
                <p className="text-sm text-gray-700 flex items-center gap-2"><FaIdCard className="text-gray-400 w-4" /> Role: {req.role} • ID: <span className="text-[11px] font-mono text-gray-400">{req._id.slice(-8)}</span></p>
                {req.experience && (
                  <p className="text-sm text-gray-700 flex items-center gap-2"><FaStar className="text-amber-400 w-4" /> Experience: <span className="font-bold">{req.experience}</span></p>
                )}

                {/* UMRAH PROOF (visa/ticket photo from onboarding) */}
                {req.umrahProof ? (
                  <a href={req.umrahProof} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-bold flex items-center gap-2 hover:underline">
                    <FaLink className="w-4" /> View Umrah Proof (Visa/Ticket) <FaEye className="text-xs" />
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 flex items-center gap-2"><FaLink className="w-4" /> No Umrah proof uploaded</p>
                )}
              </div>

              {/* AGENCY SECTION (only for Self/Family type) */}
              {req.performerType === 'Self/Family' && (
                <div className="px-5 py-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <FaHandshake className="text-primary" /> Agency Connection
                  </h4>

                  {req.agencyConnect === 'Connected' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <div className="flex items-center gap-2.5">
                        <FaBuilding className="text-green-600" />
                        <p className="text-sm font-bold text-green-700">Connected: {req.agencyName}</p>
                      </div>
                      {req.agencyWebsite && (
                        <a href={req.agencyWebsite} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold flex items-center gap-1.5 mt-2 hover:underline">
                          <FaGlobe /> {req.agencyWebsite.replace(/^https?:\/\//, '')} <FaEye className="text-[10px]" />
                        </a>
                      )}
                    </div>
                  )}

                  {req.agencyConnect === 'Requested' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-2.5">
                        <FaHourglassHalf /> Request pending — enter agency name &amp; website to connect
                      </p>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Agency name (e.g., Rod Travel)"
                          value={(agencyInput[req._id] || {}).name || ''}
                          onChange={(e) => setAgencyField(req._id, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white border border-amber-200 focus:border-amber-400 focus:outline-none text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Agency website (e.g., rodtravel.pk)"
                          value={(agencyInput[req._id] || {}).website || ''}
                          onChange={(e) => setAgencyField(req._id, 'website', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-white border border-amber-200 focus:border-amber-400 focus:outline-none text-sm"
                        />
                        <button
                          onClick={() => handleAgencyConnect(req._id)}
                          disabled={agencyBusy === req._id}
                          className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 text-xs flex items-center gap-1.5 disabled:opacity-60 flex-shrink-0"
                        >
                          {agencyBusy === req._id ? '...' : <><FaHandshake /> Connect</>}
                        </button>
                        <button
                          onClick={() => handleAgencyReject(req._id)}
                          disabled={agencyBusy === req._id}
                          className="bg-gray-200 text-gray-600 font-bold px-3 py-2 rounded-lg hover:bg-gray-300 text-xs disabled:opacity-60 flex-shrink-0"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {req.agencyConnect === 'None' && (
                    <p className="text-xs text-gray-400">No agency request.</p>
                  )}
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="p-4 bg-white flex justify-between items-center border-t border-gray-100">
                {req.isVerified ? (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 text-green-600 text-xs font-bold"><FaCheckCircle /> Verified &amp; Ready</span>
                    <button
                      onClick={() => handleVerify(req._id, false)}
                      className="text-[11px] text-amber-600 hover:text-amber-700 font-bold hover:underline"
                    >
                      Unverify
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDelete(req._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 font-semibold text-xs transition-colors"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                    <button
                      onClick={() => handleVerify(req._id, true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 font-semibold text-xs transition-colors shadow-sm"
                    >
                      <FaCheckCircle /> Verify &amp; Approve
                    </button>
                  </div>
                )}
                {/* Delete (to remove old test entries) */}
                <button
                  onClick={() => setDeleteId(req._id)}
                  title="Delete performer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 font-semibold text-xs transition-colors"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-500 text-xl" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete this performer?</h3>
            <p className="text-gray-500 text-sm mb-6">This performer will be permanently removed from the platform. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 text-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPerformers;
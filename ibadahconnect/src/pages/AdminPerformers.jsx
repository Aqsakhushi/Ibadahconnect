import { useState, useEffect } from 'react';
import API from '../api';
import { FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUserCheck, FaIdCard } from 'react-icons/fa';

const AdminPerformers = () => {
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchPerformers();
  }, []);

  const handleVerify = async (id) => {
    try {
      await API.put(`/auth/verify-performer/${id}`);
      // UI ko update karne ke liye state change
      setPerformers(performers.map(p => p._id === id ? { ...p, isVerified: true } : p));
      alert("Performer Verified Successfully!");
    } catch (err) {
      alert("Error verifying performer.");
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading performer requests...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Performer Requests</h1>
          <p className="text-gray-500 text-sm">Verify performers who have applied on the platform.</p>
        </div>
      </div>

      {performers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <FaUserCheck className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No new performer requests yet.</p>
          <p className="text-gray-400 text-sm mt-1">When someone signs up as a Performer, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {performers.map(req => (
            <div key={req._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
              
              {/* Top Profile Section */}
              <div className="p-5 flex items-start justify-between border-b border-gray-100">
                <div className="flex items-center gap-4">
                  {/* Avatar (User ki pehli letter) */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl">
                    {req.firstName ? req.firstName[0].toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {req.firstName} {req.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FaMapMarkerAlt className="text-gray-400" /> {req.country || 'N/A'}
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

              {/* Details Section */}
              <div className="p-5 bg-gray-50/50 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Information</h4>
                <p className="text-sm text-gray-700 flex items-center gap-2"><FaPhone className="text-gray-400 w-4" /> {req.phone || 'N/A'}</p>
                <p className="text-sm text-gray-700 flex items-center gap-2"><FaEnvelope className="text-gray-400 w-4" /> {req.email}</p>
                <p className="text-sm text-gray-700 flex items-center gap-2"><FaIdCard className="text-gray-400 w-4" /> Role: {req.role}</p>
              </div>

              {/* Action Buttons Section */}
              <div className="p-4 bg-white flex justify-end gap-3 border-t border-gray-100">
                {req.isVerified ? (
                  <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                    <FaCheckCircle /> Verified & Ready for Tasks
                  </div>
                ) : (
                  <>
                    <button 
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 font-semibold text-xs transition-colors"
                    >
                      <FaTimesCircle /> Reject
                    </button>
                    <button 
                      onClick={() => handleVerify(req._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-primary hover:bg-primary/90 font-semibold text-xs transition-colors shadow-sm"
                    >
                      <FaCheckCircle /> Verify & Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPerformers;
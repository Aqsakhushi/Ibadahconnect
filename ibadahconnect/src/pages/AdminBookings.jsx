import { useState, useEffect } from 'react';
import API from '../api';
import { FaSearch, FaBoxOpen } from 'react-icons/fa';

const AdminBookings = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

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
    fetchOrders();
  }, []);

  // Search aur Filter Logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.sponsor?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sponsor?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sponsor?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-center py-10 text-gray-500">Loading bookings...</div>;

  return (
    <div>
      {/* Header with Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">View Bookings</h1>
          <p className="text-gray-500 text-sm">A list of all proxy worship orders and donations.</p>
        </div>
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search sponsor or recipient..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-primary text-sm shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        {['All', 'Pending', 'In Progress', 'Completed'].map(tab => (
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

      {/* Premium Table Card */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <FaBoxOpen className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No bookings found for this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => (
                  <tr key={ord._id} className="hover:bg-gray-50 transition-colors">
                    {/* Sponsor Info */}
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
                    
                    {/* Recipient Info (Hidden on mobile) */}
                    <td className="py-4 px-6 hidden md:table-cell">
                      <p className="font-medium text-gray-800">{ord.recipientName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{ord.recipientRelation || ''}</p>
                    </td>
                    
                    {/* Service Type */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {ord.serviceType}
                      </span>
                    </td>

                    {/* Date (Hidden on mobile/tablet) */}
                    <td className="py-4 px-6 text-gray-500 text-xs hidden lg:table-cell">
                      {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    
                    {/* Amount */}
                    <td className="py-4 px-6 font-bold text-gray-900">PKR {ord.price.toLocaleString()}</td>
                    
                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        ord.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' : 
                        ord.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                        'bg-yellow-50 text-yellow-600 border-yellow-200'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
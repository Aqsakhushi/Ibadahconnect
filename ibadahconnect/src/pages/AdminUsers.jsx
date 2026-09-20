import { useState, useEffect } from 'react';
import API from '../api';
import { FaSearch, FaCircle } from 'react-icons/fa';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/auth/all-users');
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.log("Error fetching users");
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Search Logic (Filter by name or email)
  const filteredUsers = users.filter(user =>
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center py-10 text-gray-500">Loading users...</div>;

  return (
    <div>
      {/* Header with Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
          <p className="text-gray-500 text-sm">A list of all the users registered on the platform.</p>
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-primary text-sm shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      {/* Premium Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-semibold tracking-wider">User</th>
                <th className="py-4 px-6 font-semibold tracking-wider hidden md:table-cell">Phone</th>
                <th className="py-4 px-6 font-semibold tracking-wider hidden lg:table-cell">Country</th>
                <th className="py-4 px-6 font-semibold tracking-wider">Role</th>
                <th className="py-4 px-6 font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map(usr => (
                  <tr key={usr._id} className="hover:bg-gray-50 transition-colors">
                    {/* User Column with Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {usr.firstName ? usr.firstName[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{usr.firstName} {usr.lastName}</p>
                          <p className="text-xs text-gray-500">{usr.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-gray-600 hidden md:table-cell">{usr.phone || 'N/A'}</td>
                    <td className="py-4 px-6 text-gray-600 hidden lg:table-cell">{usr.country || 'N/A'}</td>

                    {/* Role Badge */}
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        usr.role === 'Admin' ? 'bg-red-50 text-red-600 border-red-200' :
                        usr.role === 'Performer' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {usr.role}
                      </span>
                    </td>

                    {/* Status Badge with Dot */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        usr.isVerified ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        <FaCircle className={`text-[8px] ${usr.isVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                        {usr.isVerified ? 'Verified' : 'Pending'}
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

export default AdminUsers;
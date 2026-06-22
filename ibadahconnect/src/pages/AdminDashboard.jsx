import { useState, useEffect } from 'react';
import API from '../api';

const AdminDashboard = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Umrah Badal');
  const [image, setImage] = useState('/images/noor.jpg');
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    try {
      const pkgRes = await API.get('/packages/all');
      setPackages(pkgRes.data);
      const ordRes = await API.get('/orders/all');
      setOrders(ordRes.data);
    } catch (err) { console.log("Error fetching data"); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      await API.post('/packages/add', { title, price: Number(price), desc, category, image });
      setTitle(''); setPrice(''); setDesc('');
      fetchData();
      alert("Package Added!");
    } catch (err) { alert("Error adding package"); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/packages/delete/${id}`);
      fetchData();
    } catch (err) { alert("Error deleting"); }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-outfit">
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        
        <div className="mb-10 border-b border-gray-700 pb-6">
          <h1 className="text-3xl font-extrabold text-accent" style={{ fontFamily: 'Amiri, serif' }}>Admin Control Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Manage Packages, View Sponsor Bookings & Track Orders.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Add Package Form */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 h-fit">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span>➕</span> Add New Package</h2>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <input type="text" placeholder="Package Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-accent text-white" required />
              <input type="number" placeholder="Price (PKR)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-accent text-white" required />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-accent text-white">
                <option>Umrah Badal</option>
                <option>Hajj Badal</option>
              </select>
              <input type="text" placeholder="Image Path (/images/noor.jpg)" value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-accent text-white" required />
              <textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows="3" className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 focus:outline-none focus:border-accent text-white resize-none" required></textarea>
              <button type="submit" className="w-full bg-accent text-gray-900 font-bold py-3.5 rounded-xl hover:bg-yellow-500 transition-colors">Add Package</button>
            </form>
          </div>

          {/* Right: Tables */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Existing Packages Table */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span>📦</span> Existing Packages</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                    <tr><th className="py-3 px-4">Title</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Price</th><th className="py-3 px-4">Action</th></tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => (
                      <tr key={pkg._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-bold text-white">{pkg.title}</td>
                        <td className="py-3 px-4 text-gray-400">{pkg.category}</td>
                        <td className="py-3 px-4 text-accent font-bold">PKR {pkg.price.toLocaleString()}</td>
                        <td className="py-3 px-4"><button onClick={() => handleDelete(pkg._id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button></td>
                      </tr>
                    ))}
                    {packages.length === 0 && <tr><td colSpan="4" className="text-center text-gray-500 py-6">No packages found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sponsor Bookings Table */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span>📜</span> Sponsor Bookings</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
                    <tr><th className="py-3 px-4">Sponsor</th><th className="py-3 px-4">Service</th><th className="py-3 px-4">Recipient</th><th className="py-3 px-4">Amount</th><th className="py-3 px-4">Status</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(ord => (
                      <tr key={ord._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-bold text-white">{ord.sponsor?.firstName} {ord.sponsor?.lastName}<br/><span className="text-xs text-gray-500 font-normal">{ord.sponsor?.email}</span></td>
                        <td className="py-3 px-4 text-gray-400">{ord.serviceType}</td>
                        <td className="py-3 px-4 text-gray-400">{ord.recipientName}</td>
                        <td className="py-3 px-4 text-accent font-bold">PKR {ord.price.toLocaleString()}</td>
                        <td className="py-3 px-4"><span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">{ord.status}</span></td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="5" className="text-center text-gray-500 py-6">No bookings yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from 'react';
import API from '../api';

const AdminPackages = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Umrah Badal');
  const [image, setImage] = useState('/images/noor.jpg');
  const [packages, setPackages] = useState([]);
  
  // Edit ke liye states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchPackages = async () => {
    try { const res = await API.get('/packages/all'); setPackages(res.data); } catch (err) { console.log("Err"); }
  };

  useEffect(() => { fetchPackages(); }, []);

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      await API.post('/packages/add', { title, price: Number(price), desc, category, image });
      setTitle(''); setPrice(''); setDesc('');
      fetchPackages();
      alert("Package Added Successfully!");
    } catch (err) { alert("Error adding package"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this package?")) {
      try { await API.delete(`/packages/delete/${id}`); fetchPackages(); alert("Package Deleted!"); } catch (err) { alert("Error deleting"); }
    }
  };

  const handleEditClick = (pkg) => {
    setEditingId(pkg._id);
    setTitle(pkg.title);
    setPrice(pkg.price);
    setDesc(pkg.desc);
    setCategory(pkg.category);
    setImage(pkg.image);
    setIsModalOpen(true);
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/packages/update/${editingId}`, { title, price: Number(price), desc, category, image });
      setIsModalOpen(false);
      setTitle(''); setPrice(''); setDesc('');
      fetchPackages();
      alert("Package Updated Successfully!");
    } catch (err) { alert("Error updating"); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white-800 mb-6">Manage Packages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add New Package Form */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Add New Package</h3>
          <form onSubmit={handleAddPackage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Price (PKR)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900">
                <option>Umrah Badal</option>
                <option>Hajj Badal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Image Path</label>
              <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows="3" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900 resize-none" required></textarea>
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800">Add Package</button>
          </form>
        </div>

        {/* Existing Packages Table */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Existing Packages</h3>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr><th className="py-3 px-4">Title</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Price</th><th className="py-3 px-4 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-bold text-gray-900">{pkg.title}</td>
                  <td className="py-3 px-4 text-gray-500">{pkg.category}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">PKR {pkg.price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button onClick={() => handleEditClick(pkg)} className="text-gray-900 font-medium hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(pkg._id)} className="text-red-600 font-medium hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Edit Package</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleUpdatePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Price (PKR)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900">
                    <option>Umrah Badal</option>
                    <option>Hajj Badal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Image Path</label>
                <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows="3" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-900 resize-none" required></textarea>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-gray-900 text-white font-bold py-2.5 rounded-lg hover:bg-gray-800">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackages;
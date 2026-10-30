import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12">
      <h1 className="text-3xl font-extrabold text-primary mb-8" style={{ fontFamily: 'Amiri, serif' }}>My Profile</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-3xl shadow-md">
            {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{user?.role}</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
            <input type="text" defaultValue={user?.firstName} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
            <input type="text" defaultValue={user?.lastName} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Country</label>
            <input type="text" defaultValue={user?.country} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
            <input type="text" defaultValue={user?.phone} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none" />
          </div>
        </div>
        <button className="mt-8 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">Save Changes</button>
      </div>
    </div>
  );
};

export default ProfilePage;
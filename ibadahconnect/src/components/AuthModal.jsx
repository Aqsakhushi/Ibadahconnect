import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('aqsa@ibadah.com');
  const [password, setPassword] = useState('123456');
  const [confirmPassword, setConfirmPassword] = useState('123456');
  const [role, setRole] = useState('Sponsor');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      if (isLogin) {
        const res = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onClose();
        
        // Role Based Redirection
        if (res.data.user.role === 'Admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        await API.post('/auth/signup', { firstName, lastName, country, phone, email, password, role });
        setError('Account created successfully! Please login now.');
        setIsLogin(true); 
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred. Please try again.";
      setError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 py-10">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-primary text-2xl">&times;</button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-primary mb-1" style={{ fontFamily: 'Amiri, serif' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Login to access your dashboard' : 'Register to start your spiritual journey'}
          </p>
        </div>

        {error && (
          <div className={`p-3 rounded-xl mb-4 text-sm text-center font-semibold ${error.includes('successfully') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                  <input type="text" placeholder="Aqsa" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input type="text" placeholder="Khushi" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors">
                  <option>Pakistan</option><option>Saudi Arabia</option><option>India</option><option>United States</option><option>United Kingdom</option><option>UAE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input type="tel" placeholder="+92 300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
            <input type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
          </div>

          {!isLogin && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Register as</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRole('Sponsor')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'Sponsor' ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-primary'}`}>Sponsor</button>
                  <button type="button" onClick={() => setRole('Performer')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'Performer' ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-primary'}`}>Performer</button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-all duration-300 text-lg shadow-md mt-2">
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary font-bold cursor-pointer hover:underline">
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
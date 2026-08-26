import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Sponsor');
  const [error, setError] = useState('');
  
  // Password show/hide states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

    if (!isLogin) {
      if (!firstName || !lastName || !phone) {
        setError("Please fill in all the personal details.");
        return;
      }
      if (!passwordRegex.test(password)) {
        setError("Password must contain 1 capital letter and 1 special character.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match!");
        return;
      }
    }

    try {
      if (isLogin) {
        const res = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onClose();
        
        // Yahan Role Check ho raha hai
        if (res.data.user.role === 'Admin') {
          navigate('/admin');
        } else if (res.data.user.role === 'Performer') {
          navigate('/performer-dashboard'); // Performer ko yahan jayega
        } else {
          navigate('/dashboard'); // Sponsor ko yahan jayega
        }
           } else {
        await API.post('/auth/signup', { firstName, lastName, country, phone, email, password, role });
        
        // Agar Performer hai toh auto-login kar ke onboarding par bhej do
        if (role === 'Performer') {
          const res = await API.post('/auth/login', { email, password });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          onClose();
          navigate('/performer-onboarding');
        } else {
          setError('Account created successfully! Please login now.');
          setIsLogin(true); 
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex overflow-hidden relative max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-primary text-3xl z-50">&times;</button>

        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-primary mb-1" style={{ fontFamily: 'Amiri, serif' }}>{isLogin ? 'Login to Your Account' : 'Create Account'}</h2>
            <p className="text-gray-500 text-sm">{isLogin ? 'Welcome back! Please enter your details.' : 'Register to start your spiritual journey'}</p>
          </div>

          {error && <div className={`p-3 rounded-xl mb-4 text-sm text-center font-semibold ${error.includes('successfully') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                    <input type="text" placeholder="e.g., Ahmad" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input type="text" placeholder="e.g., Ali" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" required />
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
            
            {/* Password Field with Show/Hide Toggle */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Min 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors pr-12" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 bottom-3 text-gray-400 hover:text-primary"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {!isLogin && (
              <div className="space-y-4">
                {/* Confirm Password Field with Show/Hide Toggle */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Re-enter password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors pr-12" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 bottom-3 text-gray-400 hover:text-primary"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
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

            {isLogin && (
              <div className="flex items-center justify-end">
                <a href="#" className="text-sm text-primary font-semibold hover:underline">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-all duration-300 text-lg shadow-md mt-2">{isLogin ? 'Login' : 'Create Account'}</button>
          </form>
          
          <p className="text-center text-gray-500 mt-6 text-sm">{isLogin ? "Don't have an account? " : "Already have an account? "}<span onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary font-bold cursor-pointer hover:underline">{isLogin ? 'Sign Up' : 'Login'}</span></p>
        </div>

        {/* Right Side: Picture (Hidden on mobile) */}
        <div className="hidden md:block md:w-1/2 bg-cover bg-center relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1000&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-10 text-white">
            <h2 className="text-3xl font-extrabold mb-2" style={{ fontFamily: 'Amiri, serif' }}>IbadahConnect</h2>
            <p className="text-sm opacity-80 max-w-xs">Your trusted partner for performing proxy Umrah, Hajj, and Sadaqah on behalf of your deceased loved ones.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
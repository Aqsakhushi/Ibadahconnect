import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';

const Navbar = ({ openModal }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMenuOpen(false);
    navigate('/');
  };

  // Bahar click karne pe menu band karna
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      
      <Link to="/" className="flex items-center gap-3">
        <svg className="w-8 h-8" viewBox="0 0 100 100">
          <polygon points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35" fill="#1B5E20" stroke="#D4AF37" strokeWidth="5"/>
          <path d="M35 70 Q50 35 65 70 Z" fill="#D4AF37" />
          <rect x="35" y="65" width="30" height="10" fill="#D4AF37" />
          <rect x="25" y="50" width="6" height="25" fill="#D4AF37" />
          <circle cx="28" cy="48" r="4" fill="#D4AF37" />
          <rect x="69" y="50" width="6" height="25" fill="#D4AF37" />
          <circle cx="72" cy="48" r="4" fill="#D4AF37" />
        </svg>
        <h1 className="text-xl md:text-2xl font-extrabold text-primary tracking-wide hidden sm:block" style={{ fontFamily: 'Amiri, serif' }}>
          IbadahConnect
        </h1>
      </Link>

            <div className="hidden md:flex items-center gap-8 text-gray-600 font-semibold text-sm">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <Link to="/dashboard" className="hover:text-primary transition-colors">Services</Link>
        <Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
        <Link to="/faqs" className="hover:text-primary transition-colors">FAQs</Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button className="relative p-2 text-gray-500 hover:text-primary transition-colors">
              <FaBell className="text-lg" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-3 bg-gray-50 pl-3 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors border border-gray-100">
                <span className="text-sm font-bold text-gray-800 hidden md:block">{user?.firstName}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
              </button>

              {/* Dropdown Menu (z-50 lagaya gaya hai) */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <span>👤</span> My Profile
                  </Link>
                  <Link to="/personal-info" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <span>📄</span> Personal Information
                  </Link>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <span>⚙️</span> Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border-t border-gray-100 mt-1 cursor-pointer">
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button onClick={openModal} className="bg-accent text-white font-bold px-5 py-2 rounded-full hover:bg-accent/90 transition-all duration-300 shadow-md text-sm">
            Login / Sign Up
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
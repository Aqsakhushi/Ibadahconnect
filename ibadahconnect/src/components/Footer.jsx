import { FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const Footer = () => {
  return (
    <footer className="bg-[#0a1a14] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

        {/* Column 1: Brand & Social */}
        <div>
          <div className="mb-6">
            <BrandLogo variant="light" size="md" />
          </div>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Your trusted partner for performing proxy Umrah, Hajj, and Sadaqah on behalf of your deceased loved ones with verified video proof.
          </p>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-accent hover:text-dark hover:border-accent transition-all duration-300"><FaFacebookF size={14} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-accent hover:text-dark hover:border-accent transition-all duration-300"><FaWhatsapp size={14} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-accent hover:text-dark hover:border-accent transition-all duration-300"><FaInstagram size={14} /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-accent hover:text-dark hover:border-accent transition-all duration-300"><FaYoutube size={14} /></a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-lg font-bold text-white mb-5">Quick Links</h3>
          <ul className="space-y-3 text-white/50 text-sm">
            <li><Link to="/" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Home</Link></li>
            <li><Link to="/dashboard" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Dashboard</Link></li>
            <li><a href="#how-it-works" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> How It Works</a></li>
            <li><a href="#faqs" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> FAQs</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> About Us</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Contact Us</a></li>
          </ul>
        </div>

        {/* Column 3: Services */}
        <div>
          <h3 className="text-lg font-bold text-white mb-5">Our Services</h3>
          <ul className="space-y-3 text-white/50 text-sm">
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Umrah Badal</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Hajj Badal</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Wheelchair Donation</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Roza Kushai (Iftar)</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Tasbeeh Distribution</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Ab-e-Zamzam Delivery</a></li>
            <li><a href="#" className="hover:text-accent transition-colors flex items-center gap-2"><span>→</span> Iftar for Orphans</a></li>
          </ul>
        </div>

        {/* Column 4: Contact & Newsletter */}
        <div>
          <h3 className="text-lg font-bold text-white mb-5">Get In Touch</h3>
          <ul className="space-y-4 text-white/50 text-sm mb-6">
            <li className="flex items-center gap-3"><FaEnvelope className="text-accent" /> support@ibadahconnect.com</li>
            <li className="flex items-center gap-3"><FaPhone className="text-accent" /> +92 300 1234567</li>
            <li className="flex items-center gap-3"><FaMapMarkerAlt className="text-accent" /> Makkah, Saudi Arabia</li>
          </ul>
          <div className="flex">
            <input type="email" placeholder="Your email" className="w-full px-4 py-2.5 rounded-l-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-accent" />
            <button className="bg-accent text-dark font-bold px-4 rounded-r-xl hover:bg-white transition-colors text-sm">→</button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 pt-8 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-white/40 text-xs font-medium">
        <p>&copy; 2026 IbadahConnect. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-accent transition-colors">Terms & Conditions</a>
          <a href="#" className="hover:text-accent transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
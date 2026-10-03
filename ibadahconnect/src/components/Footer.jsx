import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaKaaba, FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube,
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaCheckCircle,
  FaUserShield, FaVideo, FaAward, FaHandHoldingHeart, FaChevronRight
} from 'react-icons/fa';

/* ============================================================
   IBADAHCONNECT — FOOTER (v2 PROFESSIONAL)
   - App.jsx ka catch-all wrapper har page ke neeche pehle se hi
     <Footer /> render karta hai. Is liye pages ke andar wale
     PageFooter DELETE kar do (double footer bug).
   - v2: About Us column improved + trust strip + payment badges
     + working newsletter UI + professional hover states.
   ============================================================ */

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Our Services', to: '/services' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Reviews', to: '/reviews' },
  { label: 'FAQs', to: '/faqs' },
];

const SERVICE_LINKS = [
  { label: 'Umrah Badal', to: '/services?cat=umrah' },
  { label: 'Hajj Badal', to: '/services?cat=hajj' },
  { label: 'Donation & Sadqa', to: '/services?cat=donation' },
  { label: 'Donate in Mecca', to: '/donate' },
];

const PAY_METHODS = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Debit / Credit Card'];

const TRUST_POINTS = [
  { icon: FaUserShield, label: 'CNIC-Verified Scholars' },
  { icon: FaVideo, label: 'Live Video Proof' },
  { icon: FaAward, label: 'Official Certificate' },
  { icon: FaHandHoldingHeart, label: 'Full Refund Amanah' },
];

const SOCIALS = [
  { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
  { icon: FaWhatsapp, href: 'https://wa.me/923000000000', label: 'WhatsApp' },
  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
];

/* Agar Navbar ya kisi aur file se BrandLogo import hota hai to bhi chalega */
export function BrandLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <span className="w-11 h-11 rounded-xl bg-[#0F3D14] border border-[#D4AF37]/50 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors">
        <FaKaaba className="text-[#E8C96A] text-lg" />
      </span>
      <span className="text-xl font-extrabold text-white">Ibadah<span className="text-[#D4AF37]">Connect</span></span>
    </Link>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="bg-[#08240C] text-white/70 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        .icf-serif { font-family: 'Amiri', Georgia, serif; }
        .icf-pattern { background-image: radial-gradient(rgba(212,175,55,0.5) 1px, transparent 1px); background-size: 24px 24px; }
      `}</style>

      {/* ---------- TRUST STRIP ---------- */}
      <div className="bg-[#061A09] border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TRUST_POINTS.map((t) => (
            <div key={t.label} className="flex items-center justify-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0F3D14] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <t.icon className="text-[#E8C96A] text-[12px]" />
              </span>
              <span className="text-[11.5px] font-bold tracking-wide text-white/75">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* subtle gold pattern overlay */}
      <div className="absolute inset-0 icf-pattern opacity-[0.04] pointer-events-none" />

      {/* ---------- MAIN GRID ---------- */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

        {/* About Us */}
        <div className="lg:col-span-4">
          <BrandLogo />
          <p className="mt-5 text-[13px] leading-relaxed text-white/60">
            IbadahConnect is Pakistan&apos;s trusted platform for Badal Umrah, Badal Hajj and Sadaqah.
            Every Ibadah is performed on your behalf by CNIC-verified scholars inside Masjid al-Haram,
            Makkah — with live video proof, milestone tracking and an official certificate.
            Your amanah is our responsibility, and we protect it at every step.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                 className="w-9 h-9 rounded-full border border-[#D4AF37]/40 bg-white/[0.04] flex items-center justify-center text-[#E8C96A] hover:bg-[#D4AF37] hover:text-[#0B2E10] hover:-translate-y-0.5 transition-all duration-300">
                <s.icon className="text-[13px]" />
              </a>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {PAY_METHODS.map((m) => (
              <span key={m} className="text-[9.5px] font-bold px-2.5 py-1 rounded-full border border-[#D4AF37]/30 text-[#E8C96A] bg-white/[0.04]">{m}</span>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2">
          <h4 className="text-[12px] font-black tracking-[0.22em] uppercase text-[#D4AF37]">Quick Links</h4>
          <div className="w-9 h-[2px] bg-gradient-to-r from-[#D4AF37] to-transparent mt-2.5" />
          <ul className="mt-5 space-y-3 text-[13.5px]">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="group inline-flex items-center gap-2 hover:text-[#E8C96A] transition-colors">
                  <FaChevronRight className="text-[9px] text-[#D4AF37]/60 group-hover:translate-x-0.5 transition-transform" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Our Services */}
        <div className="lg:col-span-3">
          <h4 className="text-[12px] font-black tracking-[0.22em] uppercase text-[#D4AF37]">Our Services</h4>
          <div className="w-9 h-[2px] bg-gradient-to-r from-[#D4AF37] to-transparent mt-2.5" />
          <ul className="mt-5 space-y-3 text-[13.5px]">
            {SERVICE_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="group inline-flex items-center gap-2 hover:text-[#E8C96A] transition-colors">
                  <FaChevronRight className="text-[9px] text-[#D4AF37]/60 group-hover:translate-x-0.5 transition-transform" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Get In Touch + Newsletter */}
        <div className="lg:col-span-3">
          <h4 className="text-[12px] font-black tracking-[0.22em] uppercase text-[#D4AF37]">Get In Touch</h4>
          <div className="w-9 h-[2px] bg-gradient-to-r from-[#D4AF37] to-transparent mt-2.5" />
          <ul className="mt-5 space-y-3.5 text-[13px]">
            <li className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0F3D14] flex items-center justify-center shrink-0"><FaPhoneAlt className="text-[#E8C96A] text-[11px]" /></span>
              <a href="tel:+923000000000" className="hover:text-[#E8C96A] transition-colors pt-1.5">+92 300 0000000</a>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0F3D14] flex items-center justify-center shrink-0"><FaEnvelope className="text-[#E8C96A] text-[11px]" /></span>
              <a href="mailto:support@ibadahconnect.com" className="hover:text-[#E8C96A] transition-colors pt-1.5">support@ibadahconnect.com</a>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0F3D14] flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-[#E8C96A] text-[11px]" /></span>
              <span className="pt-1.5">Near Masjid al-Haram, Makkah, Saudi Arabia</span>
            </li>
          </ul>

          <p className="mt-6 text-[12px] font-bold text-white/70">Ibadah reminders &amp; updates, straight to your inbox</p>
          {subscribed ? (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] font-bold text-[#E8C96A] bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl px-4 py-3">
              <FaCheckCircle /> JazakAllah Khair! You are subscribed.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="mt-3 flex items-center gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="min-w-0 flex-1 px-4 py-2.5 rounded-full bg-white/[0.06] border border-[#D4AF37]/30 text-[12.5px] text-white placeholder-white/35 focus:outline-none focus:border-[#D4AF37]/70 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              <button type="submit" aria-label="Subscribe"
                className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#0B2E10] flex items-center justify-center shadow-lg hover:scale-105 transition-transform shrink-0">
                <FaPaperPlane className="text-[13px]" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ---------- BOTTOM BAR ---------- */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/45 text-center sm:text-left">
            © {new Date().getFullYear()} IbadahConnect — All rights reserved.{' '}
            <span className="icf-serif text-[#D4AF37]/80">Your Amanah, Our Responsibility.</span>
          </p>
          <div className="flex items-center gap-5 text-[12px] text-white/45">
            <a href="#" className="hover:text-[#E8C96A] transition-colors">Privacy Policy</a>
            <span className="text-white/20">|</span>
            <a href="#" className="hover:text-[#E8C96A] transition-colors">Terms of Service</a>
            <span className="text-white/20">|</span>
            <a href="#" className="hover:text-[#E8C96A] transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
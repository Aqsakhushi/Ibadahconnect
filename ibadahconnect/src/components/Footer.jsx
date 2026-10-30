import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaKaaba, FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube,
  FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaCheckCircle,
  FaChevronRight, FaArrowUp, FaStar, FaVideo, FaAward, FaClock,
} from 'react-icons/fa';

/* ============================================================
   IBADAHCONNECT — FOOTER (v5 FINAL)
   ✓ English CTA: "They Prayed for You All Their Life..."
   ✓ Arabic dua + English translation
   ✓ Glowing mosque skyline (pure SVG)
   ✓ Floating gold particles + twinkling stars + aurora mesh
   ✓ Gold shine-sweep button + WhatsApp button
   ✓ Real contacts: wa.me/923390138178 • ibadahconnect@gmail.com
   ============================================================ */

const WA_LINK = 'https://wa.me/923390138178';
const PHONE_DISPLAY = '+92 339 0138178';
const EMAIL = 'ibadahconnect@gmail.com';

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

const SOCIALS = [
  { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
  { icon: FaWhatsapp, href: WA_LINK, label: 'WhatsApp' },
  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
];

const CTA_CHIPS = [
  { icon: FaKaaba, label: 'Inside Masjid al-Haram' },
  { icon: FaVideo, label: 'Live Video Proof' },
  { icon: FaAward, label: 'Official Certificate' },
  { icon: FaClock, label: 'Completed in 3–4 Days' },
];

/* ───────── Glowing mosque skyline (pure SVG — koi image nahi) ───────── */
const MosqueSkyline = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 1440 170" preserveAspectRatio="none" aria-hidden="true">
    <g fill="currentColor">
      <rect x="0" y="150" width="1440" height="20" />
      <rect x="0" y="118" width="440" height="34" />
      <rect x="1000" y="118" width="440" height="34" />
      {/* central dome */}
      <path d="M600 152 v-26 c0-52 50-78 120-78 s120 26 120 78 v26 z" />
      <rect x="714" y="28" width="12" height="24" />
      <circle cx="720" cy="24" r="7" />
      {/* side domes */}
      <path d="M455 152 v-16 c0-34 32-52 78-52 s78 18 78 52 v16 z" />
      <path d="M829 152 v-16 c0-34 32-52 78-52 s78 18 78 52 v16 z" />
      {/* left minaret */}
      <rect x="330" y="46" width="14" height="106" rx="7" />
      <path d="M337 10 l11 20 h-22 z" />
      <circle cx="337" cy="40" r="10" />
      {/* right minaret */}
      <rect x="1094" y="46" width="14" height="106" rx="7" />
      <path d="M1101 10 l11 20 h-22 z" />
      <circle cx="1101" cy="40" r="10" />
      {/* glowing golden door */}
      <path d="M700 152 v-20 a20 22 0 0 1 40 0 v20 z" fill="#D4AF37" opacity="0.3" />
    </g>
  </svg>
);

export function BrandLogo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <span className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0F3D14] to-[#1B5E20] border border-[#D4AF37]/50 flex items-center justify-center group-hover:border-[#D4AF37] group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-black/30">
        <FaKaaba className="text-[#E8C96A] text-lg" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-white">
        Ibadah<span className="text-[#D4AF37]">Connect</span>
      </span>
    </Link>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <footer className="relative bg-[#06180A] text-white/70 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        .icf-serif { font-family: 'Amiri', Georgia, serif; }
        .icf-stars {
          background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-opacity='0.35'%3E%3Cpath d='M32 6l6.5 19.5L58 32l-19.5 6.5L32 58l-6.5-19.5L6 32l19.5-6.5z'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 64px 64px;
        }
        @keyframes icf-line { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .icf-animated-line { background: linear-gradient(90deg, transparent, #D4AF37, #F5E6B8, #D4AF37, transparent); background-size: 200% 100%; animation: icf-line 6s linear infinite; }
        @keyframes icf-twinkle { 0%,100% { opacity:.12; } 50% { opacity:.85; } }
        @keyframes icf-rise { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: .75; } 100% { transform: translateY(-170px); opacity: 0; } }
        @keyframes icf-aurora { from { background-position: 0% 0%, 100% 0%, 50% 100%; } to { background-position: 25% 20%, 75% 25%, 45% 85%; } }
        .icf-aurora {
          background:
            radial-gradient(ellipse 55% 80% at 12% 15%, rgba(27,94,32,.55), transparent 60%),
            radial-gradient(ellipse 45% 70% at 88% 10%, rgba(212,175,55,.14), transparent 60%),
            radial-gradient(ellipse 75% 60% at 50% 115%, rgba(4,17,7,.95), transparent 70%);
          animation: icf-aurora 16s ease-in-out infinite alternate;
        }
        @keyframes icf-shine { 0%,55% { transform: translateX(-160%) skewX(-20deg); } 100% { transform: translateX(300%) skewX(-20deg); } }
        .icf-btn-gold { position: relative; overflow: hidden; }
        .icf-btn-gold::after {
          content:''; position:absolute; top:0; left:0; width:55%; height:100%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,.55), transparent);
          transform: translateX(-160%) skewX(-20deg);
          animation: icf-shine 3.8s ease-in-out infinite;
        }
        .icf-link { position: relative; }
        .icf-link::after { content:''; position:absolute; left:0; bottom:-3px; height:1px; width:0; background: linear-gradient(90deg,#D4AF37,transparent); transition: width .35s ease; }
        .icf-link:hover::after { width:100%; }
        @keyframes icf-glowpulse { 0%,100% { text-shadow: 0 0 18px rgba(212,175,55,.25); } 50% { text-shadow: 0 0 34px rgba(212,175,55,.55); } }
      `}</style>

      {/* ───────── GOLD ANIMATED TOP LINE ───────── */}
      <div className="h-[2px] icf-animated-line opacity-80" />

      {/* ═══════════ CTA BAND — mosque skyline + dua + buttons ═══════════ */}
      <div className="relative overflow-hidden border-b border-[#D4AF37]/15">
        {/* aurora mesh */}
        <div className="absolute inset-0 icf-aurora" aria-hidden="true" />

        {/* twinkling stars */}
        {[[6,14],[15,7],[24,19],[38,9],[52,16],[63,6],[74,18],[86,11],[93,20],[45,5]].map(([x, y], i) => (
          <span key={i} className="absolute w-1 h-1 rounded-full bg-[#F5E6B8] pointer-events-none"
                style={{ left: `${x}%`, top: `${y}%`, animation: `icf-twinkle ${2.2 + (i % 4) * 0.8}s ease-in-out ${i * 0.3}s infinite` }}
                aria-hidden="true" />
        ))}

        {/* floating gold particles */}
        {[...Array(14)].map((_, i) => (
          <span key={`p${i}`} className="absolute rounded-full bg-[#E8C96A] pointer-events-none"
                style={{
                  left: `${(i * 71 + 13) % 96}%`, bottom: '12%',
                  width: 2 + (i % 3), height: 2 + (i % 3),
                  animation: `icf-rise ${6 + (i % 5)}s linear ${i * 0.85}s infinite`,
                }}
                aria-hidden="true" />
        ))}

        {/* mosque skyline */}
        <MosqueSkyline className="absolute bottom-0 left-0 w-full h-20 md:h-28 text-[#031107]" />

        {/* content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 md:pb-32 text-center">

          {/* Arabic dua */}
          <p className="icf-serif text-[#E8C96A] text-xl md:text-2xl leading-relaxed"
             dir="rtl" style={{ animation: 'icf-glowpulse 5s ease-in-out infinite' }}>
            اللَّهُمَّ اغْفِرْ لَهُمْ وَارْحَمْهُمْ
          </p>
          <p className="text-[11px] text-white/40 mt-1.5 tracking-wide">
            O Allah, forgive them — and shower Your mercy upon them.
          </p>

          {/* headline */}
          <h3 className="mt-5 text-2xl md:text-4xl font-extrabold text-white leading-tight">
            They Prayed for You All Their Life.
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6B8] to-[#D4AF37] bg-clip-text text-transparent">
              Now It&apos;s Your Turn.
            </span>
          </h3>

          <p className="mt-4 text-[13px] md:text-sm text-white/55 max-w-xl mx-auto leading-relaxed">
            Honor them with an Umrah performed in their name — inside the sacred walls of
            Masjid al-Haram, by a CNIC-verified scholar, with live video proof of every ritual
            and an official certificate in your hands.
          </p>

          {/* trust chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {CTA_CHIPS.map((c) => (
              <span key={c.label}
                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-white/70 bg-white/[0.06] border border-[#D4AF37]/25 rounded-full px-3 py-1.5 backdrop-blur-sm">
                <c.icon className="text-[#E8C96A] text-[10px]" /> {c.label}
              </span>
            ))}
          </div>

          {/* dual buttons */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/services"
              className="icf-btn-gold group inline-flex items-center gap-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A83C] text-[#0B2E10] font-extrabold px-8 py-3.5 rounded-full shadow-xl shadow-[#D4AF37]/25 hover:shadow-2xl hover:shadow-[#D4AF37]/45 hover:-translate-y-0.5 transition-all duration-300 text-sm">
              <FaKaaba /> Book Umrah Badal
              <FaChevronRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={WA_LINK} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2.5 bg-white/[0.05] border border-[#25D366]/40 text-white/85 font-bold px-7 py-3.5 rounded-full backdrop-blur-sm hover:bg-[#25D366]/15 hover:border-[#25D366]/70 hover:-translate-y-0.5 transition-all duration-300 text-sm">
              <FaWhatsapp className="text-[#25D366] text-base" />
              WhatsApp — {PHONE_DISPLAY}
            </a>
          </div>

          {/* micro trust line */}
          <p className="mt-4 text-[10.5px] text-white/35">
            🔒 Your payment is held as Amanah — released only after video-verified completion.
          </p>
        </div>
      </div>

      {/* ───────── ORNAMENT DIVIDER ───────── */}
      <div className="relative flex items-center justify-center py-1.5" aria-hidden="true">
        <div className="h-px w-32 sm:w-48 bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
        <span className="mx-3 text-[#D4AF37]/60 text-[10px]">✦</span>
        <div className="h-px w-32 sm:w-48 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
      </div>

      {/* ───────── STAR PATTERN OVERLAY ───────── */}
      <div className="absolute inset-0 icf-stars opacity-[0.035] pointer-events-none" aria-hidden="true" />

      {/* ═══════════ MAIN GRID ═══════════ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

        {/* Brand */}
        <div className="lg:col-span-4">
          <BrandLogo />
          <p className="mt-5 text-[13px] leading-relaxed text-white/55">
            IbadahConnect is Pakistan&apos;s trusted platform for Badal Umrah, Badal Hajj and Sadaqah —
            performed by CNIC-verified scholars inside Masjid al-Haram, Makkah, with live proof and an
            official certificate.
          </p>

          <div className="mt-5 flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                 className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-[#0B2E10] hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all duration-300">
                <s.icon className="text-[14px]" />
              </a>
            ))}
          </div>

          <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 mb-2.5">Secure Payments</p>
          <div className="flex flex-wrap gap-2">
            {PAY_METHODS.map((m) => (
              <span key={m} className="text-[9.5px] font-bold px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/55 hover:border-[#D4AF37]/50 hover:text-[#E8C96A] transition-colors">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-2">
          <h4 className="text-[11px] font-black tracking-[0.22em] uppercase text-[#D4AF37] flex items-center gap-2">
            <span className="text-[8px] opacity-70">✦</span> Quick Links
          </h4>
          <ul className="mt-5 space-y-3 text-[13.5px]">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="icf-link group inline-flex items-center gap-2 text-white/60 hover:text-[#E8C96A] transition-colors">
                  <FaChevronRight className="text-[8px] text-[#D4AF37]/50 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div className="lg:col-span-3">
          <h4 className="text-[11px] font-black tracking-[0.22em] uppercase text-[#D4AF37] flex items-center gap-2">
            <span className="text-[8px] opacity-70">✦</span> Our Services
          </h4>
          <ul className="mt-5 space-y-3 text-[13.5px]">
            {SERVICE_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="icf-link group inline-flex items-center gap-2 text-white/60 hover:text-[#E8C96A] transition-colors">
                  <FaChevronRight className="text-[8px] text-[#D4AF37]/50 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact + Newsletter */}
        <div className="lg:col-span-3">
          <h4 className="text-[11px] font-black tracking-[0.22em] uppercase text-[#D4AF37] flex items-center gap-2">
            <span className="text-[8px] opacity-70">✦</span> Get In Touch
          </h4>
          <ul className="mt-5 space-y-2 text-[13px]">
            {/* WhatsApp — prominent */}
            <li>
              <a href={WA_LINK} target="_blank" rel="noreferrer"
                 className="group flex items-center gap-3 rounded-xl p-2.5 -m-2.5 bg-[#25D366]/[0.07] border border-[#25D366]/25 hover:border-[#25D366]/60 hover:bg-[#25D366]/[0.12] transition-all">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#25D366]/25 to-transparent border border-[#25D366]/35 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FaWhatsapp className="text-[#25D366] text-base" />
                </span>
                <span>
                  <span className="block text-white/80 group-hover:text-white font-bold text-[13px]">{PHONE_DISPLAY}</span>
                  <span className="block text-[10px] text-[#25D366] font-bold">WhatsApp — Instant Reply</span>
                </span>
              </a>
            </li>
            {/* Email */}
            <li>
              <a href={`mailto:${EMAIL}`} className="group flex items-center gap-3 rounded-xl p-2.5 -m-2.5 hover:bg-white/[0.04] transition-colors">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FaEnvelope className="text-[#E8C96A] text-sm" />
                </span>
                <span className="text-white/60 group-hover:text-[#E8C96A] transition-colors">{EMAIL}</span>
              </a>
            </li>
            {/* Location */}
            <li className="flex items-center gap-3 p-2.5 -m-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <FaMapMarkerAlt className="text-[#E8C96A] text-sm" />
              </span>
              <span className="text-white/60 text-[12.5px] leading-snug">Near Masjid al-Haram,<br />Makkah, Saudi Arabia</span>
            </li>
          </ul>

          {/* Newsletter — glass card */}
          <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md p-4 shadow-lg shadow-black/20">
            <p className="text-[12px] font-bold text-white/80 flex items-center gap-1.5">
              <FaPaperPlane className="text-[#E8C96A] text-[10px]" /> Ibadah reminders, straight to your inbox
            </p>
            {subscribed ? (
              <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#E8C96A] bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl px-3.5 py-2.5">
                <FaCheckCircle /> JazakAllah Khair! You&apos;re subscribed.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-3 flex items-center gap-2">
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="min-w-0 flex-1 px-4 py-2.5 rounded-full bg-black/25 border border-white/10 text-[12.5px] text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]/70 focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                <button type="submit" aria-label="Subscribe"
                  className="icf-btn-gold w-10 h-10 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#0B2E10] flex items-center justify-center shadow-lg hover:scale-110 transition-transform shrink-0">
                  <FaPaperPlane className="text-[12px]" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ───────── SOFT STATS LINE ───────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <span className="text-[12px] font-bold text-white/50">
            <span className="text-[#E8C96A] text-sm font-extrabold">500+</span> Ibadah Completed
          </span>
          <span className="w-px h-4 bg-white/10 hidden sm:block" />
          <span className="text-[12px] font-bold text-white/50">
            <span className="text-[#E8C96A] text-sm font-extrabold">100%</span> Video Proof
          </span>
          <span className="w-px h-4 bg-white/10 hidden sm:block" />
          <span className="text-[12px] font-bold text-white/50 flex items-center gap-1.5">
            <span className="text-[#E8C96A] text-sm font-extrabold">4.9</span> Avg Rating
            <span className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <FaStar key={i} className="text-[#D4AF37] text-[8px]" />)}
            </span>
          </span>
        </div>
      </div>

      {/* ───────── BOTTOM BAR ───────── */}
      <div className="relative border-t border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11.5px] text-white/40 text-center sm:text-left">
            © {new Date().getFullYear()} IbadahConnect — All rights reserved.{' '}
            <span className="icf-serif text-[#D4AF37]/70">Your Amanah, Our Responsibility.</span>
          </p>
          <div className="flex items-center gap-4 text-[11.5px] text-white/40">
            <a href="#" className="icf-link hover:text-[#E8C96A] transition-colors">Privacy Policy</a>
            <span className="text-white/15">•</span>
            <a href="#" className="icf-link hover:text-[#E8C96A] transition-colors">Terms of Service</a>
            <span className="text-white/15">•</span>
            <a href="#" className="icf-link hover:text-[#E8C96A] transition-colors">Refund Policy</a>
          </div>
        </div>
        <p className="text-center text-[10.5px] text-white/25 pb-4">
          Made with Ikhlas 🤍 — Pakistan 🇵🇰 → Makkah 🕋
        </p>
      </div>

      {/* ───────── BACK TO TOP ───────── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-[#0F3D14] to-[#1B5E20] border border-[#D4AF37]/50 text-[#E8C96A] shadow-xl shadow-black/40 flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#0B2E10] hover:-translate-y-1 transition-all duration-300
          ${showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <FaArrowUp className="text-sm" />
      </button>
    </footer>
  );
}

export { Footer };
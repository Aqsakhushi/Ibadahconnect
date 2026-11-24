import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

/* ---------------- inline SVG icons (Navbar ke style se match, no emoji, no extra deps) ---------------- */

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3V11H9v3h2.3v7h2.2z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3zm0 2a7 7 0 11-3.6 13l-.4-.2-2.4.6.6-2.3-.2-.4A7 7 0 0112 5zm-2.9 3.4c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.1.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.5-.5-1-1.2-1.4-1.8-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.5-.6-.5h-.4z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.8 1.8c1.5.4 7.8.4 7.8.4s6.3 0 7.8-.4a2.5 2.5 0 001.8-1.8A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7l8.5 6 8.5-6" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l1.5 4.5L8 10a12 12 0 006 6l1.5-2.5L20 15v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const TopIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/* ---------------- static link groups (sirf confirmed routes) ---------------- */

const EXPLORE = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'All Services' },
  { to: '/how-it-works', label: 'About Us' },
  { to: '/guide', label: 'Guidelines' },
  { to: '/faqs', label: 'FAQs & Help' },
];

const SERVICES = ['Umrah Badal', 'Hajj Badal', 'Sadaqah & Donations', 'Wheelchair Donation', 'Iftar & Roza Kushai'];

const TRUST = ['Shariah-compliant', 'Verified performers', 'Live video proof'];

const Footer = () => {
  return (
    <footer className="relative bg-[#0B2117] text-white overflow-hidden">
      {/* gold hairline — navbar ke golden line se match */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
      {/* halka green glow — depth ke liye */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#1B5E20]/25 blur-3xl pointer-events-none" />

      {/* back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Back to top"
        className="absolute top-5 right-5 sm:right-8 z-10 w-9 h-9 rounded-full border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0B2117] flex items-center justify-center transition-colors"
      >
        <TopIcon />
      </button>

      <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">

          {/* Brand */}
          <div className="lg:col-span-4 sm:col-span-2">
            <BrandLogo variant="light" size="md" />
            <p className="text-white/50 text-sm leading-relaxed mt-5 max-w-xs">
              Performing Umrah, Hajj and Sadaqah on behalf of your loved ones — with verified performers, live video proof and milestone tracking from Pakistan to Makkah.
            </p>
            <div className="flex gap-2.5 mt-6">
              <a href="#" title="Facebook" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[#D4AF37] hover:text-[#0B2117] hover:border-[#D4AF37] transition-colors"><FacebookIcon /></a>
              <a href="#" title="WhatsApp" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[#D4AF37] hover:text-[#0B2117] hover:border-[#D4AF37] transition-colors"><WhatsappIcon /></a>
              <a href="#" title="Instagram" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[#D4AF37] hover:text-[#0B2117] hover:border-[#D4AF37] transition-colors"><InstagramIcon /></a>
              <a href="#" title="YouTube" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[#D4AF37] hover:text-[#0B2117] hover:border-[#D4AF37] transition-colors"><YoutubeIcon /></a>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-5">Explore</h3>
            <ul className="space-y-3">
              {EXPLORE.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="group inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <ArrowIcon />
                    <span className="group-hover:translate-x-0.5 transition-transform">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-5">Services</h3>
            <ul className="space-y-3">
              {SERVICES.map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-[#D4AF37] hover:text-white transition-colors">
              View all services <ArrowIcon />
            </Link>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-5">Get in Touch</h3>
            <ul className="space-y-3.5 text-sm text-white/60">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0"><MailIcon /></span>
                support@ibadahconnect.com
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0"><PhoneIcon /></span>
                +92 300 1234567
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0"><PinIcon /></span>
                Makkah, Saudi Arabia
              </li>
            </ul>
            <p className="text-[11px] text-white/35 mt-4 leading-relaxed">Support hours: 9am — 9pm (PKT). We usually reply within 24 hours.</p>
          </div>
        </div>

        {/* trust strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 mt-12 pt-6 border-t border-white/10">
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-2 text-xs font-semibold text-white/55">
              <span className="text-[#D4AF37]"><CheckIcon /></span>
              {t}
            </span>
          ))}
        </div>

        {/* bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-6 text-white/35 text-xs">
          <p>&copy; 2026 IbadahConnect — Your amanah, our responsibility.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Terms &amp; Conditions</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

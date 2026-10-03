import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaKaaba, FaCheckCircle, FaPhoneAlt, FaHandsHelping, FaSearch, FaEnvelope, FaMapMarkerAlt
} from 'react-icons/fa';

/* ============================================================
   IBADAHCONNECT — FAQS PAGE (v2)
   (v2: MiniHeader REMOVE — double navbar khatam, kyunke asli
    navbar App.jsx se har page pe already aata hai.
    Page aur attractive: tag filter chips + smooth accordion.)
   IMPORTANT: teeno naam export hain taake App.jsx jo bhi import kare
   chal jaye: FaqsPage (default + named), FaqPage, FAQsPage
   ============================================================ */

const PAY_METHODS = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Debit / Credit Card'];

const FAQS = [
  { tag: 'Badal', q: 'What is Badal Umrah / Badal Hajj?', a: 'Badal means performing Umrah or Hajj on behalf of someone else — a deceased parent, an elderly relative, or a sick loved one who cannot travel. A certified scholar performs the complete Ibadah inside the Holy Haram on their name, exactly as the person themselves would have performed it.' },
  { tag: 'Shariah', q: 'Is performing Ibadah on behalf of someone else Shariah-approved?', a: 'Yes. Scholars agree that Hajj and Umrah Badal is valid for those who cannot perform it themselves due to illness, old age, or death. It is based on the hadith of Ibn Abbas (RA) in which the Prophet (PBUH) instructed a woman to perform Hajj on behalf of her deceased mother.' },
  { tag: 'Proof', q: 'How do I know the Ibadah was actually performed?', a: 'You join a live video call while your Ibadah is being performed, and afterwards you receive the complete recording, photos, and an official IbadahConnect certificate — permanent proof of your amanah being fulfilled.' },
  { tag: 'Scholars', q: 'Who performs the Ibadah on my behalf?', a: 'Only certified male scholars perform Ibadah through IbadahConnect. Every performer is CNIC-verified, certificate-verified, and reviewed by our Shariah committee before joining the platform.' },
  { tag: 'Booking', q: 'Can I book Umrah Badal for more than one person?', a: 'Yes. During booking you can enter the name of the person on whose behalf the Ibadah will be performed, and you may book separate Ibadahs for multiple family members or loved ones.' },
  { tag: 'Booking', q: 'How long does it take after booking?', a: 'Most Umrah Badal bookings are scheduled within 3 to 7 days. You are informed of the exact date and time in advance so you can join the live video call from home.' },
  { tag: 'Payment', q: 'What payment methods do you accept?', a: 'We accept Easypaisa, JazzCash, bank transfer and debit/credit cards. Your payment is held as an amanah and only released to the performer after your Ibadah is completed and verified.' },
  { tag: 'Refund', q: 'Can I get a refund if the Ibadah is not performed?', a: 'Yes. If your booked Ibadah is not performed for any reason, you receive a full refund — no questions asked. Your amanah and your trust are our first responsibility.' },
  { tag: 'Tracking', q: 'Can I track my booking after payment?', a: 'Yes. Every booking gets an order code. You can track the status, see the assigned scholar, watch milestone proofs, and view your completion progress in real time from the Track My Order section of your dashboard.' },
  { tag: 'Proof', q: 'Will I receive a certificate after completion?', a: 'Yes. An official IbadahConnect certificate is issued for every completed booking — signed, verifiable, and delivered to your dashboard along with the full video recording and photos.' },
];

const TAGS = ['All', ...new Set(FAQS.map((f) => f.tag))];

/* ================= UI PRIMITIVES ================= */

function PageHero({ kicker, title, sub, Icon }) {
  const Ic = Icon || FaKaaba;
  return (
    <section className="relative bg-gradient-to-r from-[#0B2E10] via-[#0F3D14] to-[#0B2E10] py-16 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 ic-dots opacity-[0.1]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto ic-float">
          <Ic className="text-2xl text-[#E8C96A]" />
        </span>
        <span className="inline-block mt-5 text-[11px] font-black tracking-[0.25em] uppercase text-[#E8C96A] border border-[#D4AF37]/40 bg-white/5 px-4 py-1.5 rounded-full">
          {kicker}
        </span>
        <h1 className="font-amiri text-3xl sm:text-[2.6rem] font-bold text-white mt-4 leading-tight">{title}</h1>
        {sub ? <p className="mt-3 text-[15px] leading-relaxed text-white/70">{sub}</p> : null}
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-16 bg-gradient-to-r from-[#0B2E10] via-[#0F3D14] to-[#0B2E10] relative overflow-hidden">
      <div className="absolute inset-0 ic-dots opacity-[0.1]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FaKaaba className="text-4xl text-[#D4AF37] mx-auto ic-float" />
        <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-white mt-4">Ready to Fulfill This Sacred Duty?</h2>
        <p className="mt-3 text-[14.5px] text-white/70 leading-relaxed max-w-xl mx-auto">
          Book your Badal Umrah, Badal Hajj or Sadaqah today — performed inside the Holy Haram, with live video and an official certificate.
        </p>
        <Link to="/services" className="inline-block mt-7 px-9 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#10240F] font-extrabold text-[15px] shadow-xl hover:scale-[1.03] transition-transform">
          Book Your Ibadah Now
        </Link>
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="bg-[#08240C] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#0F3D14] border border-[#D4AF37]/50 flex items-center justify-center"><FaKaaba className="text-[#E8C96A] text-lg" /></span>
            <span className="text-xl font-extrabold text-white">Ibadah<span className="text-[#D4AF37]">Connect</span></span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/55">
            Pakistan&apos;s trusted platform for Badal Umrah, Badal Hajj and Sadaqah in Makkah — performed by certified scholars inside the Holy Haram, with live video proof and certificates.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PAY_METHODS.map((m) => (
              <span key={m} className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#D4AF37]/30 text-[#E8C96A] bg-white/[0.04]">{m}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[12px] font-black tracking-[0.2em] uppercase text-[#D4AF37]">Quick Links</h4>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><Link to="/" className="hover:text-[#E8C96A] transition-colors">Home</Link></li>
            <li><Link to="/reviews" className="hover:text-[#E8C96A] transition-colors">Reviews</Link></li>
            <li><Link to="/faqs" className="hover:text-[#E8C96A] transition-colors">FAQs</Link></li>
            <li><Link to="/how-it-works" className="hover:text-[#E8C96A] transition-colors">How It Works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[12px] font-black tracking-[0.2em] uppercase text-[#D4AF37]">Our Services</h4>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            <li><Link to="/services?cat=umrah" className="hover:text-[#E8C96A] transition-colors">Umrah Badal</Link></li>
            <li><Link to="/services?cat=hajj" className="hover:text-[#E8C96A] transition-colors">Hajj Badal</Link></li>
            <li><Link to="/services?cat=donation" className="hover:text-[#E8C96A] transition-colors">Donation &amp; Sadqa</Link></li>
            <li><Link to="/donate" className="hover:text-[#E8C96A] transition-colors">Donate in Mecca</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[12px] font-black tracking-[0.2em] uppercase text-[#D4AF37]">Contact Us</h4>
          <ul className="mt-4 space-y-3 text-[13.5px]">
            <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-[#0F3D14] flex items-center justify-center shrink-0"><FaPhoneAlt className="text-[#E8C96A] text-[11px]" /></span>+92 300 0000000</li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-[#0F3D14] flex items-center justify-center shrink-0"><FaHandsHelping className="text-[#E8C96A] text-[11px]" /></span>support@ibadahconnect.com</li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-[#0F3D14] flex items-center justify-center shrink-0"><FaMapMarkerAlt className="text-[#E8C96A] text-[11px]" /></span>Near Masjid al-Haram, Makkah, Saudi Arabia</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-[12px] text-white/45">
        © {new Date().getFullYear()} IbadahConnect — Your Amanah, Our Responsibility.
      </div>
    </footer>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans" style={{ fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        .font-amiri { font-family: 'Amiri', 'Georgia', serif; }
        .ic-dots { background-image: radial-gradient(rgba(212,175,55,0.9) 1px, transparent 1px); background-size: 22px 22px; }
        @keyframes ic-float-kf { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .ic-float { animation: ic-float-kf 5s ease-in-out infinite; }
      `}</style>
      {children}
    </div>
  );
}

/* ================= MAIN PAGE ================= */

function FaqsContent() {
  const [openQ, setOpenQ] = useState(FAQS[0].q);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All');

  const filtered = useMemo(() => {
    let list = tag === 'All' ? FAQS : FAQS.filter((f) => f.tag === tag);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((f) => (f.q + ' ' + f.a + ' ' + f.tag).toLowerCase().includes(q));
    }
    return list;
  }, [query, tag]);

  return (
    <section className="py-16 sm:py-20 bg-[#FAF6EE]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8962E] text-sm" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions — e.g. refund, certificate, shariah..."
            className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white border border-[#E9DFC8] text-[13.5px] font-semibold text-[#0F3D14] placeholder-[#a8a08a] focus:outline-none focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 shadow-sm"
          />
        </div>

        {/* Tag filter chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                tag === t
                  ? 'bg-[#0F3D14] text-[#E8C96A] border border-[#D4AF37]/50 shadow-sm'
                  : 'bg-white text-[#5a6a58] border border-[#E9DFC8] hover:border-[#D4AF37] hover:text-[#B8962E]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-3 mt-8">
          {filtered.map((f) => {
            const isOpen = openQ === f.q;
            return (
              <div key={f.q} className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-[#D4AF37]/50 shadow-md' : 'border-[#E9DFC8] hover:border-[#D4AF37]/30 hover:shadow-sm'}`}>
                <button onClick={() => setOpenQ(isOpen ? null : f.q)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-[9.5px] font-black tracking-[0.15em] uppercase text-[#B8962E] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-2.5 py-1 rounded-full shrink-0">{f.tag}</span>
                    <span className="text-[14px] font-extrabold text-[#0F3D14]">{f.q}</span>
                  </span>
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black transition-transform duration-300 ${isOpen ? 'bg-[#0F3D14] text-[#E8C96A] rotate-45' : 'bg-[#FAF6EE] text-[#B8962E]'}`}>+</span>
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5">
                    <div className="border-l-2 border-[#D4AF37]/50 pl-4">
                      <p className="text-[13.5px] leading-relaxed text-[#5a6a58]">{f.a}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FaSearch className="text-3xl text-[#D4AF37] mx-auto" />
            <p className="font-bold text-[#0F3D14] mt-3">No questions matched your search.</p>
            <p className="text-[13px] text-[#5a6a58] mt-1">Try another keyword — or contact us directly below.</p>
          </div>
        ) : null}

        {/* Contact card */}
        <div className="mt-12 bg-white rounded-[1.6rem] border border-[#E9DFC8] shadow-sm p-8 text-center">
          <span className="w-12 h-12 rounded-2xl bg-[#FAF6EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
            <FaEnvelope className="text-xl text-[#B8962E]" />
          </span>
          <h3 className="font-amiri text-2xl font-bold text-[#0F3D14] mt-4">Still Have a Question?</h3>
          <p className="text-[13.5px] text-[#5a6a58] mt-2 max-w-md mx-auto">
            Our team replies within a few hours — call, email, or book a free consultation about your Ibadah.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="tel:+923000000000" className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#0F3D14] text-[#E8C96A] text-[13px] font-extrabold border border-[#D4AF37]/40 hover:bg-[#0B2E10] transition-colors">
              <FaPhoneAlt className="inline mr-2 -mt-0.5" /> +92 300 0000000
            </a>
            <a href="mailto:support@ibadahconnect.com" className="w-full sm:w-auto px-7 py-3 rounded-full border-2 border-[#0F3D14] text-[#0F3D14] text-[13px] font-extrabold hover:bg-[#0F3D14] hover:text-[#E8C96A] transition-colors">
              Email Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqsPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Need Help?"
        title="Frequently Asked Questions"
        sub="Everything you need to know about Badal Ibadah, live video proof, certificates, tracking and payments."
        Icon={FaCheckCircle}
      />
      <FaqsContent />
      <CtaBand />
      <PageFooter />
    </PageShell>
  );
}

/* Default + teeno naming variants — App.jsx jo bhi import kare, chalega */
export default FaqsPage;
export { FaqsPage };
export { FaqsPage as FaqPage };
export { FaqsPage as FAQsPage };
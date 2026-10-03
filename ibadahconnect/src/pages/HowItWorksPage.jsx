import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaKaaba, FaPhoneAlt, FaMosque, FaHandsHelping,
  FaShieldAlt, FaMapMarkerAlt, FaAward, FaVideo, FaCheckCircle
} from 'react-icons/fa';

/* ============================================================
   IBADAHCONNECT — HOW IT WORKS PAGE (v2)
   (v2: MiniHeader REMOVE — double navbar khatam, kyunke asli
    navbar App.jsx se har page pe already aata hai.)
   - 3 simple steps + proof/evidence band + payment amanah strip
   ============================================================ */

const PAY_METHODS = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Debit / Credit Card'];

const STEPS = [
  { icon: FaMosque, title: 'Book Your Ibadah', desc: 'Choose Umrah Badal, Hajj Badal or a Sadaqah, share the name of the person it is for, and complete your booking online in minutes.' },
  { icon: FaVideo, title: 'Scholar Performs It', desc: 'A verified scholar performs the Ibadah inside the Holy Haram. You join on a live video call and watch your Ibadah being performed.' },
  { icon: FaAward, title: 'Proof & Certificate', desc: 'You receive the full video recording, photos and an official IbadahConnect certificate as permanent proof of your Ibadah.' },
];

const EVIDENCE = [
  { icon: FaVideo, title: 'Live Video Call', desc: 'Watch your Ibadah being performed in real time.' },
  { icon: FaMapMarkerAlt, title: 'Inside the Holy Haram', desc: 'Every Ibadah is performed within Masjid al-Haram.' },
  { icon: FaShieldAlt, title: 'Verified Scholars', desc: 'CNIC & certificate verified male scholars only.' },
  { icon: FaAward, title: 'Official Certificate', desc: 'A signed Ibadah certificate issued for every booking.' },
];

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

export default function HowItWorksPage() {
  return (
    <PageShell>
      <PageHero
        kicker="Simple & Transparent"
        title="How IbadahConnect Works"
        sub="From booking to certificate — see exactly how your Ibadah is completed inside the Holy Haram, step by step."
        Icon={FaVideo}
      />

      {/* Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="hidden md:block absolute top-9 left-[18%] right-[18%] border-t-2 border-dashed border-[#D4AF37]/40" />
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="relative z-10 w-[72px] h-[72px] mx-auto rounded-2xl bg-gradient-to-br from-[#0F3D14] to-[#1B5E20] border border-[#D4AF37]/45 flex items-center justify-center shadow-lg ic-float" style={{ animationDelay: `${i * 0.7}s` }}>
                  <s.icon className="text-2xl text-[#E8C96A]" />
                </div>
                <span className="inline-block mt-4 px-3 py-0.5 rounded-full bg-[#D4AF37]/12 text-[#B8962E] text-[10px] font-black tracking-[0.2em] uppercase">Step {i + 1}</span>
                <h3 className="font-amiri text-xl font-bold text-[#0F3D14] mt-2">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#5a6a58] max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof evidence */}
      <section className="py-16 bg-[#0F3D14] relative overflow-hidden">
        <div className="absolute inset-0 ic-dots opacity-[0.07]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase text-[#E8C96A] border border-[#D4AF37]/40 bg-white/5 px-4 py-1.5 rounded-full">Your Amanah Is Protected</span>
            <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-white mt-4">Four Layers of Proof, Zero Blind Trust</h2>
            <p className="mt-3 text-[14.5px] text-white/60 max-w-xl mx-auto">We built IbadahConnect so you never have to wonder whether your Ibadah was performed — you see it, track it, and keep the certificate forever.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EVIDENCE.map((e) => (
              <div key={e.title} className="bg-white/[0.06] border border-[#D4AF37]/25 rounded-2xl p-5 text-center hover:border-[#D4AF37]/60 transition-colors">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#0B2E10] border border-[#D4AF37]/40 flex items-center justify-center">
                  <e.icon className="text-xl text-[#E8C96A]" />
                </div>
                <h3 className="text-[14px] font-extrabold text-white mt-3">{e.title}</h3>
                <p className="text-[12px] text-white/60 mt-1 leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment amanah strip */}
      <section className="py-20 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[1.8rem] border border-[#E9DFC8] shadow-sm p-8 sm:p-10 text-center">
            <span className="w-12 h-12 rounded-2xl bg-[#FAF6EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
              <FaShieldAlt className="text-xl text-[#B8962E]" />
            </span>
            <h3 className="font-amiri text-2xl font-bold text-[#0F3D14] mt-4">Your Payment Is Held as an Amanah</h3>
            <p className="text-[13.5px] text-[#5a6a58] mt-3 max-w-xl mx-auto leading-relaxed">
              We accept all major payment methods. Your money is only released to the performing scholar after your Ibadah is completed and verified with video proof — and if it is not performed, you receive a full refund, no questions asked.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {PAY_METHODS.map((m) => (
                <span key={m} className="text-[11px] font-black px-4 py-2 rounded-full bg-[#FAF6EE] border border-[#D4AF37]/30 text-[#0F3D14]">
                  <FaCheckCircle className="inline mr-1.5 -mt-0.5 text-[#B8962E]" />{m}
                </span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 max-w-md mx-auto divide-x divide-[#D4AF37]/25">
              {[['500+', 'Ibadah Completed'], ['100%', 'Video Proof'], ['4.9/5', 'Avg Rating']].map(([n, l]) => (
                <div key={l} className="px-2">
                  <div className="font-amiri text-2xl font-bold text-[#0F3D14]">{n}</div>
                  <div className="text-[10.5px] font-bold tracking-wide text-[#8a968a] mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </PageShell>
  );
}

export { HowItWorksPage };
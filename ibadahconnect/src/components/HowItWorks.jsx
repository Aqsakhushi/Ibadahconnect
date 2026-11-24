import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaKaaba, FaMosque, FaShieldAlt, FaMapMarkerAlt, FaAward, FaCheckCircle,
  FaHandHoldingHeart, FaChevronDown, FaArrowRight, FaUserCheck, FaCamera,
  FaCreditCard,
} from 'react-icons/fa';

/* ============================================================
   IBADAHCONNECT — ABOUT / HOW IT WORKS PAGE (v5)
   - Content rewritten for IbadahConnect (own wording, our features only)
   - Umrah Badal, Hajj Badal and Donations are highlighted three times:
     hero shortcuts, service cards, and a tabbed step-by-step flow
   - Transitions: scroll-reveal (IntersectionObserver), staggered cards,
     animated step line, count-up stats, smooth FAQ accordion
   - No new dependencies. Honors prefers-reduced-motion.
   ============================================================ */

const goTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ---------------- DATA ---------------- */

const SERVICES = [
  {
    id: 'umrah',
    anchor: 'umrah-badal',
    icon: FaKaaba,
    name: 'Umrah Badal',
    tag: 'Umrah on behalf of someone else',
    desc: 'A verified performer completes your Umrah for a loved one who is ill, elderly or no longer with us.',
    points: ['Ihram, Tawaf, Sa\u2019i and Halq', 'Every milestone updated live', 'Photo and video proof'],
    cta: 'Book Umrah Badal',
    to: '/dashboard',
  },
  {
    id: 'hajj',
    anchor: 'hajj-badal',
    icon: FaMosque,
    name: 'Hajj Badal',
    tag: 'Hajj on behalf of someone else',
    desc: 'The full Hajj journey performed for someone who cannot go, with each stage recorded and shared with you.',
    points: ['Miqat, Mina, Arafah and Muzdalifah', 'Rami, Qurbani, Tawaf and Sa\u2019i', 'Completion certificate'],
    cta: 'Book Hajj Badal',
    to: '/dashboard',
  },
  {
    id: 'donation',
    anchor: 'donations',
    icon: FaHandHoldingHeart,
    name: 'Donations & Sadaqah',
    tag: 'Charity delivered in Makkah',
    desc: 'Give Quran copies, water, Iftar meals, wheelchairs and more, handed over on your behalf with proof.',
    points: ['Purchase receipt and photos', 'Handover video with location', 'Report and dua for you'],
    cta: 'Give a Donation',
    to: '/donations',
  },
];

const STEP_ICONS = [FaHandHoldingHeart, FaCreditCard, FaMapMarkerAlt, FaAward];

const FLOWS = {
  umrah: [
    { title: 'Choose and book', desc: 'Pick an Umrah Badal package and enter the name of the person it is for, along with any special dua or instruction.' },
    { title: 'Pay securely', desc: 'Pay by Easypaisa, JazzCash, bank transfer or card. A verified performer is then assigned to your order.' },
    { title: 'Performed and tracked', desc: 'Your performer completes Ihram, Tawaf, Sa\u2019i and Halq. Each milestone appears on your tracking page with proof.' },
    { title: 'Proof and certificate', desc: 'Receive the photos, video and a completion certificate once every milestone is done.' },
  ],
  hajj: [
    { title: 'Choose and book', desc: 'Pick a Hajj Badal package and enter the name of the person it is for, with any special dua or instruction.' },
    { title: 'Pay securely', desc: 'Pay by Easypaisa, JazzCash, bank transfer or card. A verified performer is then assigned to your order.' },
    { title: 'Performed and tracked', desc: 'Your performer moves through Ihram, Mina, Arafah, Muzdalifah, Rami, Qurbani, Tawaf and Sa\u2019i. Every stage is logged with proof.' },
    { title: 'Proof and certificate', desc: 'Receive the proof from each stage and a completion certificate for your records.' },
  ],
  donation: [
    { title: 'Choose a donation', desc: 'Select a Sadaqah such as Quran copies, drinking water, Iftar meals, a wheelchair or Tasbeeh, and share whose behalf it is on.' },
    { title: 'Pay securely', desc: 'Pay by Easypaisa, JazzCash, bank transfer or card. A performer in Makkah is assigned to carry it out.' },
    { title: 'Bought and handed over', desc: 'Your performer buys the items, uploads the receipt and photos, then records the handover with their location.' },
    { title: 'Report and dua', desc: 'You get a short report, the handover video and a dua made for you and your family.' },
  ],
};

const EVIDENCE = [
  { icon: FaCamera, title: 'Photo and video proof', desc: 'Every milestone is submitted with photos or video.' },
  { icon: FaMapMarkerAlt, title: 'Location check', desc: 'Proofs carry the performer\u2019s GPS location, checked against the holy sites.' },
  { icon: FaUserCheck, title: 'Verified performers', desc: 'CNIC-verified performers who have completed their own Umrah.' },
  { icon: FaAward, title: 'Official certificate', desc: 'A completion certificate is issued when every milestone is done.' },
];

const PROMISES = [
  { icon: FaShieldAlt, title: 'Trust, verified', desc: 'Performers are checked before they can accept a task, and nothing is marked complete without proof.' },
  { icon: FaHandHoldingHeart, title: 'Respect for every request', desc: 'Names, intentions and instructions are recorded exactly as you give them and shown to your performer.' },
  { icon: FaCreditCard, title: 'Clear and flexible', desc: 'Package prices are shown upfront, with Easypaisa, JazzCash, bank transfer and card all accepted.' },
];

const SADAQAH = ['Quran copies', 'Drinking water', 'Iftar meals', 'Wheelchairs', 'Tasbeeh', 'Roza Kushai'];

const PAY_METHODS = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Debit / Credit Card'];

const FAQS = [
  {
    q: 'Who can book Umrah Badal or Hajj Badal?',
    a: 'Badal is generally accepted for someone who is permanently unable to travel, for example because of serious illness or old age, or who has passed away. If your situation is unclear, please ask a trusted scholar before booking.',
  },
  {
    q: 'Who performs the Ibadah?',
    a: 'Only performers who have been verified through their CNIC and who have completed their own Umrah can accept tasks. Every performer is reviewed before taking an order.',
  },
  {
    q: 'How will I know it was actually done?',
    a: 'Each milestone is submitted with photo or video proof and the performer\u2019s location. You can follow it on the Track My Order page using your order code, and you receive a certificate at the end.',
  },
  {
    q: 'What donations can I make?',
    a: 'You can give Quran copies, drinking water, Iftar meals, wheelchairs, Tasbeeh, Roza Kushai and other Sadaqah packages. Each one comes with a receipt, photos and a handover video.',
  },
  {
    q: 'How do I pay?',
    a: 'We accept Easypaisa, JazzCash, bank transfer and debit or credit card. Your performer is paid only after the work is completed and its proof is verified.',
  },
  {
    q: 'How long does it take?',
    a: 'Most requests are completed within a few days of a performer being assigned. You can see progress on your tracking page at any time.',
  },
  {
    q: 'What if I need a refund or have a problem?',
    a: 'Please contact our support team and see the Refund Policy in the footer. We will look into your order and reply as quickly as we can.',
  },
];

/* ---------------- MOTION HELPERS ---------------- */

const hasObserver = () => typeof IntersectionObserver !== 'undefined';
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  // Without IntersectionObserver support, show everything straight away.
  const [shown, setShown] = useState(() => !hasObserver());
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasObserver()) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown];
}

function Reveal({ as: Tag = 'div', from = 'up', delay = 0, className = '', children }) {
  const [ref, shown] = useInView();
  return (
    <Tag
      ref={ref}
      className={`ic-reveal ic-from-${from} ${shown ? 'ic-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

function CountUp({ to, decimals = 0, suffix = '' }) {
  const [ref, shown] = useInView(0.4);
  const [value, setValue] = useState(0);
  const reduce = prefersReducedMotion();
  useEffect(() => {
    if (!shown || reduce) return undefined;
    let raf;
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, reduce, to]);
  const display = reduce ? to : value;
  return <span ref={ref}>{display.toFixed(decimals)}{suffix}</span>;
}

/* ---------------- UI PRIMITIVES ---------------- */

function SectionHead({ kicker, title, sub, light = false }) {
  return (
    <Reveal className="text-center mb-12 max-w-2xl mx-auto">
      <span className={`inline-block text-[11px] font-bold tracking-[0.25em] uppercase px-4 py-1.5 rounded-full border ${light ? 'text-[#E8C96A] border-[#D4AF37]/40 bg-white/5' : 'text-[#8A6D1A] border-[#D4AF37]/40 bg-[#D4AF37]/10'}`}>
        {kicker}
      </span>
      <h2 className={`font-amiri text-3xl sm:text-4xl font-bold mt-5 leading-tight ${light ? 'text-white' : 'text-[#0F3D14]'}`}>{title}</h2>
      {sub ? <p className={`mt-3.5 text-[15px] leading-relaxed ${light ? 'text-white/70' : 'text-[#5a6a58]'}`}>{sub}</p> : null}
    </Reveal>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF6EE] overflow-x-hidden">
      <style>{`
        .ic-dots { background-image: radial-gradient(rgba(212,175,55,0.9) 1px, transparent 1px); background-size: 22px 22px; }
        @keyframes ic-float-kf { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .ic-float { animation: ic-float-kf 5s ease-in-out infinite; }
        @keyframes ic-rise-kf { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
        .ic-rise { opacity: 0; animation: ic-rise-kf 0.8s cubic-bezier(.22,1,.36,1) forwards; }
        .ic-reveal { opacity: 0; transition: opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1); will-change: opacity, transform; }
        .ic-from-up { transform: translateY(30px); }
        .ic-from-left { transform: translateX(-36px); }
        .ic-from-right { transform: translateX(36px); }
        .ic-from-zoom { transform: scale(0.94); }
        .ic-reveal.ic-in { opacity: 1; transform: none; }
        .ic-line { transform-origin: left; transform: scaleX(0); transition: transform 1.2s cubic-bezier(.22,1,.36,1) 0.2s; }
        .ic-line.ic-in { transform: scaleX(1); }
        .ic-card { transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease, border-color 0.35s ease; }
        .ic-card:hover { transform: translateY(-6px); }
        @media (prefers-reduced-motion: reduce) {
          .ic-reveal, .ic-rise { opacity: 1; transform: none; transition: none; animation: none; }
          .ic-float { animation: none; }
          .ic-line { transform: scaleX(1); transition: none; }
          .ic-card:hover { transform: none; }
        }
      `}</style>
      {children}
    </div>
  );
}

/* ---------------- SECTIONS ---------------- */

function Hero() {
  const shortcuts = [
    { label: 'Umrah Badal', id: 'umrah-badal', icon: FaKaaba },
    { label: 'Hajj Badal', id: 'hajj-badal', icon: FaMosque },
    { label: 'Donations', id: 'donations', icon: FaHandHoldingHeart },
  ];
  return (
    <section className="relative bg-gradient-to-r from-[#0B2E10] via-[#0F3D14] to-[#0B2E10] pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 ic-dots opacity-[0.1]" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="ic-rise w-14 h-14 rounded-2xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto">
          <FaKaaba className="text-2xl text-[#E8C96A] ic-float" />
        </span>
        <span className="ic-rise inline-block mt-5 text-[11px] font-bold tracking-[0.25em] uppercase text-[#E8C96A] border border-[#D4AF37]/40 bg-white/5 px-4 py-1.5 rounded-full" style={{ animationDelay: '0.12s' }}>
          About us and how it works
        </span>
        <h1 className="ic-rise font-amiri text-4xl sm:text-5xl font-bold text-white mt-5 leading-[1.15]" style={{ animationDelay: '0.24s' }}>
          Ibadah for your loved ones, <span className="text-[#E8C96A]">verified at every step</span>
        </h1>
        <p className="ic-rise mt-4 text-[15px] sm:text-base leading-relaxed text-white/75 max-w-2xl mx-auto" style={{ animationDelay: '0.36s' }}>
          IbadahConnect brings Umrah Badal, Hajj Badal and Sadaqah to your fingertips, with proof you can see and a certificate you can keep.
        </p>
        <div className="ic-rise mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: '0.5s' }}>
          {shortcuts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-white/10 border border-[#D4AF37]/50 text-white text-sm font-bold hover:bg-[#D4AF37] hover:text-[#10240F] hover:scale-[1.04] transition-all"
            >
              <s.icon className="text-base" /> {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <Reveal from="left">
          <span className="inline-block text-[11px] font-bold tracking-[0.25em] uppercase text-[#8A6D1A] border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 rounded-full">Our story</span>
          <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-[#0F3D14] mt-5 leading-tight">A trust we want to keep for you</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#4d5d4b]">
            <p>Hajj and Umrah are among the greatest acts of worship, yet many Muslims never get to perform them. Some are ill or elderly. Some passed away before they could go.</p>
            <p>Families in that position have usually relied on word of mouth, with no way to see what was done. We built IbadahConnect so that you can follow every step yourself, from your phone, with proof at each stage.</p>
            <p>Our aim is simple: let every family fulfil this trust for someone they love, with the openness they deserve.</p>
          </div>
        </Reveal>
        <Reveal from="right" delay={120}>
          <div className="relative rounded-[1.8rem] bg-[#0F3D14] p-8 sm:p-10 overflow-hidden">
            <div className="absolute inset-0 ic-dots opacity-[0.08]" />
            <div className="relative">
              <FaKaaba className="text-4xl text-[#D4AF37] ic-float" />
              <p className="font-amiri text-2xl sm:text-[1.7rem] text-white mt-5 leading-snug">Not just a booking. A trust, handled with proof.</p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {['Verified performers', 'Live milestone tracking', 'Photo and video proof', 'Completion certificate'].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-[13px] text-white/80">
                    <FaCheckCircle className="text-[#E8C96A] mt-0.5 flex-shrink-0" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HajjBadalGuide() {
  const eligibility = [
    'The representative must be a sane Muslim.',
    'The representative makes Niyyah for the named person when entering Ihram.',
    'The representative must be authorized by or on behalf of the intended person.',
    'The representative follows the Hajj type requested: Ifraad, Tamattu or Qiran.',
    'No obligatory Hajj rite may be deliberately missed.',
  ];

  return (
    <section id="hajj-badal" className="py-20 sm:py-24 bg-[#FAF8F2] scroll-mt-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-6 items-stretch">
            <article className="bg-white rounded-[1.8rem] border border-[#E9DFC8] p-7 sm:p-10 shadow-sm">
              <span className="inline-block text-[11px] font-black tracking-[0.22em] uppercase text-[#8A6D1A] border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 rounded-full">Hajj Badal</span>
              <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-[#0F3D14] mt-5 leading-tight">What is Hajj Badal?</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#4d5d4b]">
                Hajj Badal, also called Proxy Hajj or Hajj e Badal, is when a compulsory Hajj is performed on someone else's behalf by another person.
                It may be arranged for someone with an ongoing illness for which recovery is not expected, someone unable due to old age, or a person who has passed away.
              </p>

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#0F3D14] p-5 text-white">
                  <p className="text-[11px] font-black tracking-[0.18em] uppercase text-[#E8C96A]">Permissibility</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">All four major madhahib permit Hajj Badal. Umrah Badal may be performed more than once.</p>
                </div>
                <div className="rounded-2xl bg-[#FAF6EE] border border-[#E9DFC8] p-5">
                  <p className="text-[11px] font-black tracking-[0.18em] uppercase text-[#8A6D1A]">Who performs it</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#4d5d4b]">The representative must first complete their own obligatory Hajj, unless a qualified scholar identifies a valid exception.</p>
                </div>
              </div>
            </article>

            <aside className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#0F3D14] to-[#09220d] p-7 sm:p-8 text-white">
              <div className="absolute inset-0 ic-dots opacity-[0.07]" />
              <div className="relative">
                <FaMosque className="text-3xl text-[#D4AF37] ic-float" />
                <p className="mt-5 text-[11px] font-black tracking-[0.22em] uppercase text-[#E8C96A]">From the Quran</p>
                <blockquote className="font-amiri text-xl sm:text-2xl leading-relaxed mt-3 text-white/95">
                  "Hajj to the House is a duty owed to Allah by all mankind — those who can find a way to do it."
                </blockquote>
                <p className="mt-3 text-xs text-white/55">Surah Ali Imran 3:97</p>
                <div className="mt-7 border-t border-white/10 pt-5">
                  <p className="text-[11px] font-black tracking-[0.18em] uppercase text-[#E8C96A]">From the Sunnah</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                    The Prophet peace be upon him instructed a woman to perform Hajj on behalf of her deceased mother, comparing it to paying a debt owed to Allah.
                  </p>
                  <p className="mt-2 text-xs text-white/45">Sahih al-Bukhari 1754</p>
                </div>
              </div>
            </aside>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-6 rounded-[1.8rem] bg-white border border-[#E9DFC8] p-7 sm:p-9">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-black tracking-[0.22em] uppercase text-[#8A6D1A]">Eligibility &amp; Conditions</span>
                <h3 className="font-amiri text-2xl sm:text-3xl font-bold text-[#0F3D14] mt-2">What must be in place</h3>
              </div>
              <span className="text-xs text-[#68786f]">For individual cases, consult a qualified scholar</span>
            </div>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {eligibility.map((item, index) => (
                <div key={item} className="group flex items-start gap-3 rounded-2xl border border-[#E9DFC8] bg-[#FAF8F2] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/70 hover:shadow-md">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-[#0F3D14] text-[#E8C96A] flex items-center justify-center text-xs font-black">{index + 1}</span>
                  <p className="text-[13.5px] leading-relaxed text-[#4d5d4b] pt-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Services({ onSeeHow }) {
  return (
    <section className="py-20 sm:py-24 bg-[#FAF6EE]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHead
          kicker="What you can book"
          title="Three ways to give"
          sub="Choose the Ibadah that fits your intention. Each one follows the same tracked and verified process."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={i * 120} className="h-full">
              <article id={s.anchor} className="ic-card scroll-mt-28 h-full flex flex-col bg-white rounded-[1.6rem] border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-2xl p-7">
                <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F3D14] to-[#1B5E20] border border-[#D4AF37]/45 flex items-center justify-center shadow-md">
                  <s.icon className="text-2xl text-[#E8C96A]" />
                </span>
                <p className="mt-5 text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#8A6D1A]">{s.tag}</p>
                <h3 className="font-amiri text-[1.7rem] font-bold text-[#0F3D14] mt-1 leading-tight">{s.name}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[#5a6a58]">{s.desc}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[13.5px] text-[#2f3e2d]">
                      <FaCheckCircle className="text-[#B8962E] mt-1 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-col gap-2.5">
                  <Link to={s.to} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#10240F] font-extrabold text-sm shadow-md hover:scale-[1.03] transition-transform">
                    {s.cta} <FaArrowRight className="text-xs" />
                  </Link>
                  <button type="button" onClick={() => onSeeHow(s.id)} className="text-[13px] font-bold text-[#0F3D14] hover:text-[#B8962E] underline underline-offset-4 py-1">
                    See how it works
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ tab, setTab }) {
  const steps = FLOWS[tab];
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHead
          kicker="How it works"
          title="Four simple steps"
          sub="Pick a service to see exactly what happens from booking to certificate."
        />
        <Reveal className="flex justify-center mb-14">
          <div role="tablist" aria-label="Choose a service" className="inline-flex flex-wrap justify-center gap-2 p-1.5 rounded-full bg-[#FAF6EE] border border-[#E9DFC8]">
            {SERVICES.map((s) => {
              const active = tab === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(s.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${active ? 'bg-[#0F3D14] text-[#E8C96A] shadow-md' : 'text-[#4d5d4b] hover:bg-white'}`}
                >
                  <s.icon className="text-base" /> {s.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div key={tab} className="relative grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6">
          <LineAcross />
          {steps.map((st, i) => {
            const Ic = STEP_ICONS[i];
            return (
              <div key={st.title} className="ic-rise relative text-center" style={{ animationDelay: `${i * 110}ms` }}>
                <div className="relative z-10 w-[76px] h-[76px] mx-auto rounded-2xl bg-gradient-to-br from-[#0F3D14] to-[#1B5E20] border border-[#D4AF37]/45 flex items-center justify-center shadow-lg">
                  <Ic className="text-[26px] text-[#E8C96A]" />
                </div>
                <span className="inline-block mt-5 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#8A6D1A] text-[10.5px] font-extrabold tracking-[0.2em] uppercase">Step {i + 1}</span>
                <h3 className="font-amiri text-2xl font-bold text-[#0F3D14] mt-2.5">{st.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[#5a6a58] max-w-[16rem] mx-auto">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LineAcross() {
  const [ref, shown] = useInView(0.3);
  return (
    <div ref={ref} aria-hidden="true" className="hidden md:block absolute top-[38px] left-[12.5%] right-[12.5%] h-0">
      <div className={`ic-line ${shown ? 'ic-in' : ''} border-t-2 border-dashed border-[#D4AF37]/50`} />
    </div>
  );
}

function PromiseSection() {
  return (
    <section className="py-20 sm:py-24 bg-[#FAF6EE]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHead kicker="Our promise" title="What you can count on" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROMISES.map((p, i) => (
            <Reveal key={p.title} delay={i * 120} className="h-full">
              <div className="ic-card h-full bg-white rounded-2xl border border-[#E9DFC8] hover:border-[#D4AF37]/60 hover:shadow-xl p-7 text-center">
                <span className="w-12 h-12 mx-auto rounded-xl bg-[#FAF6EE] border border-[#D4AF37]/30 flex items-center justify-center">
                  <p.icon className="text-xl text-[#B8962E]" />
                </span>
                <h3 className="font-amiri text-2xl font-bold text-[#0F3D14] mt-4">{p.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[#5a6a58]">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Reveal from="left">
            <div className="h-full rounded-2xl bg-[#0F3D14] p-7">
              <p className="text-[11px] font-extrabold tracking-[0.22em] uppercase text-[#E8C96A]">Our mission</p>
              <p className="font-amiri text-2xl text-white mt-3 leading-snug">To make Umrah Badal, Hajj Badal and Sadaqah simple, transparent and affordable for Muslims everywhere.</p>
            </div>
          </Reveal>
          <Reveal from="right" delay={120}>
            <div className="h-full rounded-2xl bg-white border border-[#D4AF37]/40 p-7">
              <p className="text-[11px] font-extrabold tracking-[0.22em] uppercase text-[#8A6D1A]">Our vision</p>
              <p className="font-amiri text-2xl text-[#0F3D14] mt-3 leading-snug">A world where no one is left without the chance to benefit from Hajj, Umrah and lasting charity, with trust built on proof.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="py-20 sm:py-24 bg-[#0F3D14] relative overflow-hidden">
      <div className="absolute inset-0 ic-dots opacity-[0.07]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHead
          light
          kicker="Your amanah is protected"
          title="Four layers of proof"
          sub="You should never have to wonder whether your Ibadah was performed. You can see it, track it and keep the certificate."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EVIDENCE.map((e, i) => (
            <Reveal key={e.title} from="zoom" delay={i * 100} className="h-full">
              <div className="ic-card h-full bg-white/[0.06] border border-[#D4AF37]/25 rounded-2xl p-6 text-center hover:border-[#D4AF37]/70 hover:bg-white/[0.1]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#0B2E10] border border-[#D4AF37]/40 flex items-center justify-center">
                  <e.icon className="text-xl text-[#E8C96A]" />
                </div>
                <h3 className="text-[15px] font-bold text-white mt-4">{e.title}</h3>
                <p className="text-[13px] text-white/65 mt-1.5 leading-relaxed">{e.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Sadaqah() {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal from="zoom">
          <div className="rounded-[1.8rem] bg-[#FAF6EE] border border-[#E9DFC8] p-8 sm:p-12 text-center">
            <span className="w-12 h-12 rounded-2xl bg-white border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
              <FaHandHoldingHeart className="text-xl text-[#B8962E]" />
            </span>
            <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-[#0F3D14] mt-5">Charity that keeps giving</h2>
            <p className="text-[15px] text-[#5a6a58] mt-3.5 max-w-2xl mx-auto leading-relaxed">
              Many of our donations, like Quran copies, drinking water and wheelchairs, keep helping people long after the day you give them. That is the idea of Sadaqah Jariyah, and it is why we put donations alongside Umrah and Hajj.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {SADAQAH.map((t) => (
                <span key={t} className="text-[12.5px] font-bold px-4 py-2 rounded-full bg-white border border-[#D4AF37]/35 text-[#0F3D14]">{t}</span>
              ))}
            </div>
            <Link to="/donations" className="inline-flex items-center gap-2 mt-8 px-7 py-3 rounded-full bg-[#0F3D14] text-[#E8C96A] font-bold text-sm hover:scale-[1.03] transition-transform">
              Explore donations <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Payments() {
  return (
    <section className="py-20 bg-[#FAF6EE]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="bg-white rounded-[1.8rem] border border-[#E9DFC8] shadow-sm p-8 sm:p-12 text-center">
            <span className="w-12 h-12 rounded-2xl bg-[#FAF6EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
              <FaShieldAlt className="text-xl text-[#B8962E]" />
            </span>
            <h3 className="font-amiri text-[26px] sm:text-3xl font-bold text-[#0F3D14] mt-5">Your payment is handled with care</h3>
            <p className="text-[14px] sm:text-[15px] text-[#5a6a58] mt-3.5 max-w-xl mx-auto leading-relaxed">
              Pay the way that suits you. Your performer is paid only after the work is completed and its proof is verified.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {PAY_METHODS.map((m) => (
                <span key={m} className="text-[12px] font-bold px-4 py-2 rounded-full bg-[#FAF6EE] border border-[#D4AF37]/30 text-[#0F3D14]">
                  <FaCheckCircle className="inline mr-1.5 -mt-0.5 text-[#B8962E]" />{m}
                </span>
              ))}
            </div>
            <div className="mt-9 grid grid-cols-3 max-w-md mx-auto divide-x divide-[#D4AF37]/25">
              <div className="px-2">
                <div className="font-amiri text-[28px] font-bold text-[#0F3D14]"><CountUp to={500} suffix="+" /></div>
                <div className="text-[11px] font-bold tracking-wide text-[#6b786a] mt-1">Ibadah completed</div>
              </div>
              <div className="px-2">
                <div className="font-amiri text-[28px] font-bold text-[#0F3D14]"><CountUp to={100} suffix="%" /></div>
                <div className="text-[11px] font-bold tracking-wide text-[#6b786a] mt-1">Proof on every task</div>
              </div>
              <div className="px-2">
                <div className="font-amiri text-[28px] font-bold text-[#0F3D14]"><CountUp to={4.9} decimals={1} suffix="/5" /></div>
                <div className="text-[11px] font-bold tracking-wide text-[#6b786a] mt-1">Average rating</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Faqs() {
  const [open, setOpen] = useState(0);
  return (
    <section className="py-20 sm:py-24 bg-[#FAF6EE]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHead kicker="Common questions" title="Frequently asked questions" />
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 60}>
                <div className={`bg-white rounded-2xl border transition-colors duration-300 ${isOpen ? 'border-[#D4AF37]/70 shadow-md' : 'border-[#E9DFC8]'}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 text-left px-6 py-5"
                  >
                    <span className="text-[15px] sm:text-base font-bold text-[#0F3D14]">{f.q}</span>
                    <FaChevronDown className={`flex-shrink-0 text-[#B8962E] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div id={`faq-panel-${i}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[14px] leading-relaxed text-[#5a6a58]">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-r from-[#0B2E10] via-[#0F3D14] to-[#0B2E10] relative overflow-hidden">
      <div className="absolute inset-0 ic-dots opacity-[0.1]" />
      <Reveal className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FaKaaba className="text-4xl text-[#D4AF37] mx-auto ic-float" />
        <h2 className="font-amiri text-3xl sm:text-[2.6rem] font-bold text-white mt-5 leading-tight">Ready to fulfil this sacred duty?</h2>
        <p className="mt-4 text-[15px] text-white/70 leading-relaxed max-w-xl mx-auto">
          Book Umrah Badal or Hajj Badal, or give a donation today. Every step is tracked and every proof is yours to keep.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#10240F] font-extrabold text-[15px] shadow-xl hover:scale-[1.04] transition-transform">
            <FaKaaba /> Umrah Badal
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#10240F] font-extrabold text-[15px] shadow-xl hover:scale-[1.04] transition-transform">
            <FaMosque /> Hajj Badal
          </Link>
          <Link to="/donations" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 border-2 border-[#D4AF37] text-white font-extrabold text-[15px] hover:bg-[#D4AF37] hover:text-[#10240F] hover:scale-[1.04] transition-all">
            <FaHandHoldingHeart /> Donations
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- PAGE ---------------- */

const HowItWorksPage = () => {
  const [tab, setTab] = useState('umrah');
  const seeHow = (id) => {
    setTab(id);
    goTo('how-it-works');
  };
  return (
    <PageShell>
      <Hero />
      <Story />
      <HajjBadalGuide />
      <Services onSeeHow={seeHow} />
      <HowItWorks tab={tab} setTab={setTab} />
      <PromiseSection />
      <Proof />
      <Sadaqah />
      <Payments />
      <Faqs />
      <CtaBand />
      {/* Footer comes from App.jsx automatically */}
    </PageShell>
  );
};

export default HowItWorksPage;
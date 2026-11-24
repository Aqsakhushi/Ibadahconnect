import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaAward,
  FaCreditCard,
  FaHandsHelping,
  FaHeart,
  FaKaaba,
  FaMosque,
  FaShieldAlt,
  FaStar,
  FaVideo,
} from 'react-icons/fa';

const STORY_IMAGE = 'https://cdn.prod.website-files.com/67bc5fb5d41af9c7548f06ca/67da2cc86e5fd304930cb49b_aboutus-ourgoal%401.5x%201.webp';
const SADAQAH_IMAGE = 'https://cdn.prod.website-files.com/67bc5fb5d41af9c7548f06ca/67db15885e9f03195ebd4701_aboutus-sadaqah%401.5x%202.webp';
const GLOBE_IMAGE = 'https://cdn.prod.website-files.com/67bc5fb5d41af9c7548f06ca/67db23138f3466a741b34cda_aboutus-globe%201.webp';

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about-reveal ${visible ? 'about-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const STEPS = [
  {
    number: '01',
    icon: FaKaaba,
    title: 'Choose an Ultimate Gift',
    text: 'Select Hajj Badal or Umrah Badal, then enter the name and intention of the person you wish to honour.',
  },
  {
    number: '02',
    icon: FaCreditCard,
    title: 'Make the Payment',
    text: 'Choose a convenient payment method and receive a clear confirmation once your booking is recorded.',
  },
  {
    number: '03',
    icon: FaMosque,
    title: 'Get the Ibadah Arranged',
    text: 'Your request is assigned to a qualified, verified performer who completes the Ibadah with care.',
  },
  {
    number: '04',
    icon: FaAward,
    title: 'Receive Certification',
    text: 'Follow every milestone and receive proof and certification after the Ibadah is completed.',
  },
];

const VALUES = [
  {
    icon: FaShieldAlt,
    title: 'Our Trust',
    text: 'We fulfil the trust placed in us with care, transparency and verified proof.',
  },
  {
    icon: FaHandsHelping,
    title: 'Our Respect',
    text: 'Every beneficiary and sponsor is treated with dignity, patience and compassion.',
  },
  {
    icon: FaCreditCard,
    title: 'Our Flexibility',
    text: 'Clear package choices and convenient payment options make sacred giving easier.',
  },
];

export default function HowItWorksPage() {
  return (
    <main className="about-page">
      <style>{`
        .about-page {
          background: #faf8f2;
          color: #17301f;
          font-family: 'Outfit', 'Segoe UI', sans-serif;
          overflow: hidden;
        }
        .about-page * { box-sizing: border-box; }
        .about-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .75s ease, transform .75s cubic-bezier(.22,.61,.36,1);
        }
        .about-reveal.about-visible { opacity: 1; transform: translateY(0); }
        .about-hero {
          position: relative;
          min-height: 520px;
          display: grid;
          place-items: center;
          text-align: center;
          background:
            radial-gradient(circle at 15% 20%, rgba(212,175,55,.18), transparent 24rem),
            radial-gradient(circle at 85% 75%, rgba(255,255,255,.08), transparent 22rem),
            linear-gradient(135deg, #09220d, #164524 58%, #09220d);
          color: white;
        }
        .about-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          opacity: .12;
          background-image: radial-gradient(#e8c96a 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: linear-gradient(to bottom, black, transparent);
        }
        .about-hero-inner { position: relative; z-index: 1; max-width: 780px; padding: 80px 24px; }
        .about-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #e8c96a;
          border: 1px solid rgba(212,175,55,.45);
          background: rgba(255,255,255,.06);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
        }
        .about-hero h1 {
          margin: 22px 0 16px;
          font-family: Amiri, Georgia, serif;
          font-size: clamp(42px, 7vw, 72px);
          line-height: 1.05;
        }
        .about-hero p { max-width: 650px; margin: auto; color: rgba(255,255,255,.72); line-height: 1.8; font-size: 17px; }
        .about-hero-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
        .about-primary, .about-secondary {
          display: inline-flex; align-items: center; gap: 9px;
          min-height: 48px; border-radius: 999px; padding: 0 22px;
          font-size: 14px; font-weight: 800; text-decoration: none; transition: .25s ease;
        }
        .about-primary { background: #d4af37; color: #10240f; box-shadow: 0 14px 32px rgba(212,175,55,.18); }
        .about-primary:hover { transform: translateY(-3px); background: #e8c96a; }
        .about-secondary { color: white; border: 1px solid rgba(232,201,106,.55); }
        .about-secondary:hover { background: rgba(255,255,255,.08); transform: translateY(-3px); }
        .about-section { max-width: 1180px; margin: 0 auto; padding: 96px 24px; }
        .about-story-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 70px; }
        .about-eyebrow { color: #9a7418; font-size: 12px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
        .about-title { margin: 10px 0 18px; font-family: Amiri, Georgia, serif; color: #14371e; font-size: clamp(36px, 5vw, 54px); line-height: 1.12; }
        .about-copy { color: #5d695f; line-height: 1.85; font-size: 16px; }
        .about-copy p { margin: 0 0 16px; }
        .about-image-wrap { position: relative; }
        .about-image-wrap::before {
          content: ''; position: absolute; width: 70%; height: 70%; right: -20px; bottom: -20px;
          border-radius: 28px; background: linear-gradient(135deg, rgba(212,175,55,.25), rgba(27,94,32,.12));
        }
        .about-image-wrap img { position: relative; width: 100%; max-height: 480px; object-fit: cover; border-radius: 28px; box-shadow: 0 24px 60px rgba(15,61,20,.14); }
        .about-goal { background: #14371e; color: white; }
        .about-goal-inner { max-width: 1180px; margin: auto; padding: 90px 24px; text-align: center; }
        .about-goal-inner h2 { max-width: 850px; margin: 14px auto 16px; font-family: Amiri, Georgia, serif; font-size: clamp(34px, 5vw, 52px); line-height: 1.18; }
        .about-goal-inner p { max-width: 720px; margin: auto; color: rgba(255,255,255,.68); line-height: 1.85; }
        .about-values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 48px; }
        .about-value { padding: 28px 22px; border: 1px solid rgba(212,175,55,.28); background: rgba(255,255,255,.05); border-radius: 20px; }
        .about-value-icon { width: 48px; height: 48px; display: grid; place-items: center; margin: 0 auto 15px; border-radius: 14px; background: rgba(232,201,106,.12); color: #e8c96a; }
        .about-value h3 { margin: 0 0 8px; font-family: Amiri, Georgia, serif; font-size: 22px; }
        .about-value p { font-size: 14px; line-height: 1.7; }
        .about-mission-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .about-mission-card { min-height: 240px; border-radius: 26px; padding: 40px; display: flex; flex-direction: column; justify-content: flex-end; }
        .about-mission-card.dark { background: #14371e; color: white; }
        .about-mission-card.light { background: white; border: 1px solid #e9dfc8; color: #14371e; }
        .about-mission-card h3 { margin: 8px 0 12px; font-family: Amiri, Georgia, serif; font-size: 34px; }
        .about-mission-card p { margin: 0; line-height: 1.8; }
        .about-mission-card.light p { color: #5d695f; }
        .about-steps { background: white; }
        .about-section-head { max-width: 650px; margin: 0 auto 48px; text-align: center; }
        .about-section-head h2 { margin: 8px 0 12px; font-family: Amiri, Georgia, serif; color: #14371e; font-size: clamp(34px, 5vw, 50px); }
        .about-section-head p { color: #68756a; line-height: 1.75; }
        .about-steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; position: relative; }
        .about-step { position: relative; border: 1px solid #e9dfc8; border-radius: 22px; background: #fff; padding: 28px 22px; text-align: center; transition: .3s ease; }
        .about-step:hover { transform: translateY(-8px); border-color: rgba(212,175,55,.75); box-shadow: 0 18px 40px rgba(15,61,20,.08); }
        .about-step-number { position: absolute; right: 14px; top: 10px; font-family: Amiri, Georgia, serif; color: rgba(212,175,55,.38); font-size: 28px; }
        .about-step-icon { width: 58px; height: 58px; display: grid; place-items: center; margin: 0 auto 18px; border-radius: 18px; background: #14371e; color: #e8c96a; }
        .about-step h3 { margin: 0 0 10px; color: #14371e; font-size: 17px; }
        .about-step p { margin: 0; color: #68756a; line-height: 1.72; font-size: 14px; }
        .about-impact-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 70px; }
        .about-impact-card { border-radius: 28px; background: #14371e; padding: 48px; color: white; }
        .about-impact-card h2 { margin: 12px 0 16px; font-family: Amiri, Georgia, serif; font-size: 42px; }
        .about-impact-card p { color: rgba(255,255,255,.68); line-height: 1.85; }
        .about-impact-image { width: 100%; max-height: 420px; object-fit: cover; border-radius: 28px; }
        .about-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 24px; }
        .about-link-card { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 24px; border-radius: 18px; background: white; border: 1px solid #e9dfc8; color: #14371e; text-decoration: none; transition: .25s ease; }
        .about-link-card:hover { transform: translateY(-4px); border-color: rgba(212,175,55,.7); box-shadow: 0 16px 36px rgba(15,61,20,.07); }
        .about-link-card h3 { margin: 0 0 5px; font-family: Amiri, Georgia, serif; font-size: 21px; }
        .about-link-card span { color: #9a7418; font-size: 13px; font-weight: 800; }
        .about-cta { margin: 24px 24px 96px; border-radius: 32px; max-width: 1132px; margin-left: auto; margin-right: auto; background: linear-gradient(135deg, #09220d, #164524); color: white; text-align: center; padding: 70px 24px; }
        .about-cta h2 { margin: 12px 0; font-family: Amiri, Georgia, serif; font-size: clamp(36px, 5vw, 52px); }
        .about-cta p { color: rgba(255,255,255,.68); max-width: 620px; margin: 0 auto 28px; line-height: 1.75; }
        @media (max-width: 900px) {
          .about-story-grid, .about-impact-grid { grid-template-columns: 1fr; gap: 40px; }
          .about-values-grid { grid-template-columns: 1fr; }
          .about-mission-grid { grid-template-columns: 1fr; }
          .about-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .about-links { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .about-hero { min-height: 460px; }
          .about-section { padding: 72px 18px; }
          .about-steps-grid { grid-template-columns: 1fr; }
          .about-goal-inner { padding: 72px 18px; }
          .about-mission-card, .about-impact-card { padding: 30px 24px; }
          .about-cta { margin: 18px 18px 72px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .about-reveal { opacity: 1; transform: none; transition: none; }
          .about-primary, .about-secondary, .about-step, .about-link-card { transition: none; }
        }
      `}</style>

      <section className="about-hero">
        <div className="about-hero-inner">
          <Reveal>
            <span className="about-kicker"><FaStar /> About IbadahConnect</span>
            <h1>Our Story</h1>
            <p>
              Hajj is a sacred obligation for every Muslim who is physically and financially able. We believe families should still have a trusted opportunity to help a loved one benefit from Hajj or Umrah when illness, old age or death stands in the way.
            </p>
            <div className="about-hero-actions">
              <Link className="about-primary" to="/services"><FaKaaba /> Book Now</Link>
              <Link className="about-secondary" to="/guide">Explore Guidelines <FaArrowRight /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-section">
        <div className="about-story-grid">
          <Reveal>
            <span className="about-eyebrow">Why we began</span>
            <h2 className="about-title">Bringing sacred opportunity within reach</h2>
            <div className="about-copy">
              <p>Millions of Muslims sincerely long for the spiritual fulfilment of Hajj and Umrah, but many are unable to undertake the journey themselves.</p>
              <p>We founded IbadahConnect to bridge that gap: a trusted platform where Hajj Badal and Umrah Badal can be arranged for loved ones with clarity, dignity and evidence at every stage.</p>
              <p>Our goal is simple: make an ultimate gift of worship accessible to Muslim families regardless of their circumstances.</p>
            </div>
          </Reveal>
          <Reveal className="about-image-wrap" delay={120}>
            <img src={STORY_IMAGE} alt="The IbadahConnect mission to serve Muslim families" />
          </Reveal>
        </div>
      </section>

      <section className="about-goal">
        <div className="about-goal-inner">
          <Reveal>
            <span className="about-kicker"><FaHeart /> Our Promise</span>
            <h2>To fulfil the trust you place in us</h2>
            <p>We treat every request with reverence and ensure that every booking is handled with professional service, honest communication and milestone proof.</p>
          </Reveal>
          <div className="about-values-grid">
            {VALUES.map((value, index) => (
              <Reveal key={value.title} delay={index * 100}>
                <div className="about-value">
                  <div className="about-value-icon"><value.icon /></div>
                  <h3>{value.title}</h3>
                  <p>{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <Reveal>
          <div className="about-mission-grid">
            <div className="about-mission-card dark">
              <span className="about-eyebrow" style={{ color: '#e8c96a' }}>Our Mission</span>
              <h3>Convenient, reliable and affordable</h3>
              <p>To provide convenient, reliable and affordable Hajj Badal and Umrah Badal services to Muslims around the world.</p>
            </div>
            <div className="about-mission-card light">
              <span className="about-eyebrow">Our Vision</span>
              <h3>A trusted path to lasting reward</h3>
              <p>To make the noble gifts of Hajj and Umrah Badal accessible while maintaining transparency, scholarship and sincere service.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="about-steps">
        <div className="about-section">
          <Reveal>
            <div className="about-section-head">
              <span className="about-eyebrow">How It Works</span>
              <h2>Four clear steps</h2>
              <p>Choose Hajj or Umrah, complete your payment, follow the arranged Ibadah and receive lasting proof.</p>
            </div>
          </Reveal>
          <div className="about-steps-grid">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 100}>
                <article className="about-step">
                  <span className="about-step-number">{step.number}</span>
                  <div className="about-step-icon"><step.icon /></div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-impact-grid">
          <Reveal>
            <img className="about-impact-image" src={SADAQAH_IMAGE} alt="Charitable impact and Sadaqah Jariyah" />
          </Reveal>
          <Reveal delay={120}>
            <div className="about-impact-card">
              <span className="about-kicker"><FaHandsHelping /> Sadaqah Jariyah</span>
              <h2>A gift that keeps giving</h2>
              <p>IbadahConnect supports charitable needs alongside Hajj and Umrah facilitation. Every completed act can create benefit beyond the day of booking, while performers and beneficiaries are treated with dignity.</p>
              <p>We are committed to integrity and transparency, using available resources responsibly to serve worship and community needs.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-goal" style={{ background: '#f3eddf' }}>
        <div className="about-section" style={{ paddingTop: 76, paddingBottom: 76 }}>
          <div className="about-impact-grid">
            <Reveal>
              <span className="about-eyebrow">Serving families worldwide</span>
              <h2 className="about-title">One sincere intention, many communities</h2>
              <div className="about-copy">
                <p>IbadahConnect is designed for Muslim families in Pakistan and beyond. Sponsors can book with ease and follow progress wherever they are.</p>
                <p>Our platform brings together verified performers, clear booking, secure communication and milestone proof.</p>
              </div>
            </Reveal>
            <Reveal className="about-image-wrap" delay={120}>
              <img className="about-impact-image" src={GLOBE_IMAGE} alt="IbadahConnect serving Muslim families globally" />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="about-section" style={{ paddingBottom: 40 }}>
        <Reveal>
          <div className="about-section-head">
            <span className="about-eyebrow">Learn more</span>
            <h2>Understand Hajj and Umrah</h2>
          </div>
          <div className="about-links">
            <Link className="about-link-card" to="/guide/hajj-badal/hajj-badal-eligibility">
              <div>
                <h3>Hajj Ifraad &amp; Tamattu</h3>
                <span>Understand the differences</span>
              </div>
              <FaArrowRight />
            </Link>
            <Link className="about-link-card" to="/guide/hajj-badal/hajj-badal-qurbani">
              <div>
                <h3>Hajj Tamattu process</h3>
                <span>View the Hajj Badal guidelines</span>
              </div>
              <FaArrowRight />
            </Link>
          </div>
        </Reveal>
      </section>

      <Reveal>
        <section className="about-cta">
          <FaKaaba style={{ color: '#d4af37', fontSize: 38 }} />
          <h2>Ready to arrange an ultimate gift?</h2>
          <p>Choose a trusted package and begin Hajj or Umrah Badal for a loved one with clear milestones and proof.</p>
          <Link className="about-primary" to="/services"><FaVideo /> Explore Services</Link>
        </section>
      </Reveal>
    </main>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

/* ---------------------------------- DATA ---------------------------------- */

const COUNTRIES = [
  'Pakistan', 'India', 'Bangladesh', 'Saudi Arabia', 'United Arab Emirates',
  'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Turkey', 'Malaysia', 'Indonesia',
  'Egypt', 'Jordan', 'Morocco', 'South Africa', 'United Kingdom', 'United States',
  'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Singapore', 'Other',
];

const inputCls =
  'w-full rounded-xl border border-emerald-900/15 bg-white/90 px-4 py-3 text-[15px] text-emerald-950 placeholder-emerald-900/35 outline-none focus:border-[#0F766E] focus:ring-4 focus:ring-[#0F766E]/10 transition';

const labelCls = 'block text-[13px] font-semibold text-emerald-950/80 mb-1.5';

/* --------------------- CNIC OCR PARSER (NADRA front) ---------------------- */

/* Ye words kabhi naam nahi ho sakte — card ke headers/garbage lines filter */
const NAME_STOP = /(pakistan|islamic|republic|identity|national|government|certificate|card|cnic|gender|country|stay|birth|date|expir|name|father|husband|mother)/i;

function parseCnicText(raw) {
  const text = String(raw || '').replace(/\r/g, '');
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  /* 1) CNIC number — dashes/dots/spaces kuch bhi ho, digits se standard format */
  let cnicNumber = '';
  const rawCnic = text.match(/\d{5}[.\-\s]?\d{7}[.\-\s]?\d/);
  if (rawCnic) {
    const d = rawCnic[0].replace(/\D/g, '');
    if (d.length === 13) cnicNumber = d.slice(0, 5) + '-' + d.slice(5, 12) + '-' + d.slice(12);
  }

  /* 2) DOB — dd.mm.yyyy (form mein DOB field nahi hai, future k liye parse) */
  let dob = '';
  const dm = text.match(/\b(\d{2})[.\-/](\d{2})[.\-/](\d{4})\b/);
  if (dm) dob = dm[1] + '.' + dm[2] + '.' + dm[3];

  /* 3) Name — "Name" label k baad wali value (Father/Husband Name SKIP — bada trap!) */
  const looksName = (s) =>
    /^[A-Za-z][A-Za-z\s'.]{3,39}$/.test(s) && !NAME_STOP.test(s);
  let fullName = '';
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    /* Father/Husband/Mother Name wali line poori skip */
    if (/(father|husband|mother)\s+name/.test(lower)) continue;
    if (/\bname\b/.test(lower)) {
      /* value same line par ho to (e.g. "Name : Aqsa Khan") */
      const inline = lines[i].replace(/^.*?\bname\b\s*:?\s*/i, '').trim();
      if (looksName(inline)) { fullName = inline.replace(/\s+/g, ' '); break; }
      /* warna value agle line par hoti hai */
      const next = lines[i + 1] || '';
      if (looksName(next)) { fullName = next.replace(/\s+/g, ' '); break; }
    }
  }

  /* 4) Fallback — label match na ho to ALL-CAPS naam jaisi line dhundo (NADRA names caps mein hote hain) */
  if (!fullName) {
    for (const line of lines) {
      if (/^[A-Z][A-Z\s'.]{3,39}$/.test(line) && line.includes(' ') && !NAME_STOP.test(line)) {
        fullName = line.replace(/\s+/g, ' ');
        break;
      }
    }
  }

  return { cnicNumber, dob, fullName };
}

/* ------------------------------ SVG ART PARTS ----------------------------- */

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <line x1="3" y1="3" x2="21" y2="21" />}
  </svg>
);

const RoleIcon = ({ role }) =>
  role === 'Sponsor' ? (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-3.9 3.1-7 7-7" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" className="w-9 h-9 text-[#0F766E] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const KaabaArt = () => (
  <svg viewBox="0 0 200 200" className="w-44 h-44 mx-auto mt-10 animate-[icFloat_6s_ease-in-out_infinite] drop-shadow-2xl" fill="none">
    <ellipse cx="100" cy="174" rx="72" ry="10" fill="#D4AF37" opacity="0.15" />
    <polygon points="45,70 100,50 155,70 155,150 100,170 45,150" fill="#0d0d0f" />
    <polygon points="45,70 100,50 155,70 100,90" fill="#1c1c22" />
    <polygon points="45,88 100,108 155,88 155,96 100,116 45,96" fill="#D4AF37" opacity="0.92" />
    <polygon points="88,122 112,113 112,154 88,163" fill="#D4AF37" />
    <polygon points="88,122 112,113 112,120 88,129" fill="#b8952c" />
  </svg>
);

const CrescentArt = () => (
  <svg viewBox="0 0 100 100" className="absolute top-10 right-10 w-20 h-20 opacity-80">
    <defs>
      <mask id="icCrescentMask">
        <rect width="100" height="100" fill="white" />
        <circle cx="68" cy="40" r="34" fill="black" />
      </mask>
    </defs>
    <circle cx="50" cy="52" r="40" fill="#D4AF37" mask="url(#icCrescentMask)" />
  </svg>
);

const Stars = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[
      { t: '14%', l: '10%' }, { t: '22%', l: '80%' }, { t: '10%', l: '52%' },
      { t: '62%', l: '6%' }, { t: '72%', l: '90%' }, { t: '40%', l: '92%' },
    ].map((s, i) => (
      <span key={i} className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-[icPulse_3s_ease-in-out_infinite]" style={{ top: s.t, left: s.l, animationDelay: `${i * 0.7}s` }} />
    ))}
  </div>
);

const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 14 }).map((_, i) => (
      <span key={i} className="absolute bottom-0 w-1 h-1 rounded-full bg-[#D4AF37]/60 animate-[icRise_9s_linear_infinite]" style={{ left: `${(i * 7 + 3) % 96}%`, animationDuration: `${7 + (i % 5) * 2}s`, animationDelay: `${i * 0.9}s` }} />
    ))}
  </div>
);

const Clouds = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-10 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-[icDrift_14s_ease-in-out_infinite]" />
    <div className="absolute bottom-0 -right-20 w-80 h-80 rounded-full bg-[#D4AF37]/10 blur-3xl animate-[icDrift_18s_ease-in-out_infinite_reverse]" />
  </div>
);

/* --------------------------------- PAGE ----------------------------------- */

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState('Sponsor');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [cnic, setCnic] = useState('');
  const [cnicScan, setCnicScan] = useState({ fileName: '', preview: '', status: 'idle' }); // idle | scanning | done | failed
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* already logged in? -> role-based redirect */
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u) {
        const r = String(u.role || 'Sponsor').toLowerCase();
        navigate(r === 'admin' ? '/admin' : r === 'performer' ? '/performer-dashboard' : '/dashboard', { replace: true });
      }
    } catch (e) { /* ignore */ }
  }, [navigate]);

  /* toast auto-dismiss */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* CNIC auto-format: 42101-1234567-1 */
  const handleCnic = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
    let out = digits;
    if (digits.length > 5) out = digits.slice(0, 5) + '-' + digits.slice(5);
    if (digits.length > 12) out = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    setCnic(out);
  };

  /* CNIC picture -> browser OCR (tesseract.js) -> auto-fill name + CNIC number */
  const handleCnicUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (cnicScan.status === 'scanning') return;
    if (file.size > 15 * 1024 * 1024) {
      setToast({ type: 'info', text: 'Image is too large — please upload a picture under 15MB.' });
      return;
    }

    const preview = URL.createObjectURL(file);
    setCnicScan({ fileName: file.name, preview, status: 'scanning' });

    /* OCR run — dynamic import taake page package ke bina bhi crash na ho */
    let text = '';
    try {
      const mod = await import('tesseract.js');
      const Tesseract = mod.default || mod;
      const { data } = await Tesseract.recognize(file, 'eng');
      text = (data && data.text) || '';
    } catch (err) {
      const msg = String((err && err.message) || '');
      setCnicScan({ fileName: file.name, preview, status: 'failed' });
      if (/Failed to fetch dynamically imported module|Failed to resolve|Cannot find module/i.test(msg)) {
        setToast({ type: 'info', text: 'OCR package not installed — run "npm install tesseract.js" in the frontend folder and restart the dev server.' });
      } else {
        setToast({ type: 'info', text: 'Could not read the CNIC picture — please type your details manually.' });
      }
      return;
    }

    /* Parse + autofill — sirf jo fields mile wohi bharti hain, user edit kar sakta hai */
    const fields = parseCnicText(text);
    let filled = 0;
    if (fields.cnicNumber) { setCnic(fields.cnicNumber); filled++; }
    if (fields.fullName) {
      const parts = fields.fullName.split(/\s+/);
      setFirstName(parts[0] || firstName);
      setLastName(parts.slice(1).join(' ') || lastName);
      filled++;
    }

    setCnicScan({ fileName: file.name, preview, status: filled > 0 ? 'done' : 'failed' });
    if (filled > 0) {
      setToast({ type: 'success', text: 'Details auto-filled from CNIC — please review and correct if needed.' });
    } else {
      setToast({ type: 'info', text: 'Could not read the CNIC clearly — please type your details manually.' });
    }
  };

  /* password strength */
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const strengthLabel = password.length === 0 ? '' : score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
  const barColor = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-orange-400' : score === 3 ? 'bg-amber-400' : 'bg-emerald-500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!firstName.trim() || !lastName.trim()) return setToast({ type: 'error', text: 'Please enter your full name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setToast({ type: 'error', text: 'Please enter a valid email address.' });
    if (phone.replace(/\D/g, '').length < 10) return setToast({ type: 'error', text: 'Please enter a valid phone number (at least 10 digits).' });
    if (cnic && !/^\d{5}-\d{7}-\d{1}$/.test(cnic)) return setToast({ type: 'error', text: 'CNIC format must be 42101-1234567-1.' });
    if (password.length < 6) return setToast({ type: 'error', text: 'Password must be at least 6 characters.' });
    if (password !== confirm) return setToast({ type: 'error', text: 'Passwords do not match.' });

    setLoading(true);
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim(),
        country,
      };
      if (cnic) payload.idNumber = cnic;

      let res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) {
        res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || 'Signup failed. Please try again.');

      setToast({ type: 'success', text: 'Account created successfully! Redirecting to login...' });
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex flex-col overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes icFloat {0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes icRise {0%{transform:translateY(0);opacity:0}10%{opacity:.7}100%{transform:translateY(-110vh);opacity:0}}
        @keyframes icPulse {0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}
        @keyframes icDrift {0%,100%{transform:translate(0,0)}50%{transform:translate(30px,18px)}}
        @keyframes icFadeUp {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes icToast {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ic-serif{font-family:'Cinzel',serif}
        .ic-lattice{background-image:linear-gradient(45deg,rgba(212,175,55,.25) 25%,transparent 25%,transparent 75%,rgba(212,175,55,.25) 75%),linear-gradient(45deg,rgba(212,175,55,.25) 25%,transparent 25%,transparent 75%,rgba(212,175,55,.25) 75%);background-size:44px 44px;background-position:0 0,22px 22px}
      `}</style>

      {/* ================= TOP BAR ================= */}
      <header className="sticky top-0 z-50 h-16 shrink-0 bg-[#04241b]/95 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 sm:px-8">
        <a href="/" className="flex items-center">
          <BrandLogo variant="light" size="md" />
        </a>
        <a href="/login" className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#04241b] text-sm font-bold hover:bg-[#e5c053] transition-colors">
          Login
        </a>
      </header>

      {/* ================= SPLIT (no calc = no misalignment possible) ================= */}
      <main className="flex-1 lg:grid lg:grid-cols-[1.05fr_1fr]">

        {/* ---------- LEFT: animated brand panel ---------- */}
        <section className="relative hidden lg:flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[#0b3d2e] via-[#0F766E] to-[#064e3b] px-12 py-12">
          <div className="absolute inset-0 ic-lattice opacity-[0.12]" />
          <Clouds />
          <Stars />
          <Particles />
          <CrescentArt />

          <div className="relative z-10 max-w-lg mx-auto xl:mx-0">
            <p className="text-[#D4AF37] text-xs font-extrabold tracking-[0.35em] uppercase">Assalamu Alaikum</p>
            <h1 className="ic-serif text-white text-4xl xl:text-5xl leading-tight mt-4">
              Begin Your Journey of <span className="text-[#D4AF37]">Faith</span>
            </h1>
            <p className="text-white/70 mt-5 leading-relaxed text-[15px]">
              Create your account to sponsor Umrah, Hajj badal and sadqah with verified
              performers — every rite documented, every niyyat honoured.
            </p>

            <KaabaArt />

            <div className="mt-10 pt-6 border-t border-white/15">
              <p dir="rtl" className="ic-serif text-[#D4AF37] text-xl leading-loose">
                وَأَذِّن فِي النَّاسِ بِالْحَجِّ
              </p>
              <p className="text-white/60 text-sm mt-2 italic">
                "And proclaim Hajj among the people..." — Surah Al-Hajj 22:27
              </p>
            </div>
          </div>
        </section>

        {/* ---------- RIGHT: form card ---------- */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14">
          <div className="w-full max-w-xl animate-[icFadeUp_.6s_ease-out_both]">
            <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl shadow-emerald-900/10 p-6 sm:p-10">

              <div className="text-center mb-7">
                <p className="text-[11px] font-extrabold tracking-[0.3em] text-[#0F766E] uppercase">Join IbadahConnect</p>
                <h2 className="ic-serif text-3xl sm:text-4xl text-emerald-950 mt-2">Create Your Account</h2>
                <p className="text-sm text-emerald-900/60 mt-2">Book sacred rites with verified performers — or offer your service.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* role selector */}
                <p className={labelCls}>I am joining as</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Sponsor', 'Performer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-4 transition-all ${
                        role === r
                          ? 'border-[#0F766E] bg-[#0F766E]/[0.06] text-[#0F766E] shadow-md shadow-emerald-900/10'
                          : 'border-emerald-900/10 bg-white/60 text-emerald-900/50 hover:border-[#0F766E]/40'
                      }`}
                    >
                      <RoleIcon role={r} />
                      <span className="font-bold text-sm">{r}</span>
                      <span className="text-[11px] leading-tight opacity-75">
                        {r === 'Sponsor' ? 'Book rites for someone' : 'Perform rites & earn'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4 mt-5">
                  {/* names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className={labelCls}>First Name</label>
                      <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="First Name" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelCls}>Last Name</label>
                      <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Last Name " />
                    </div>
                  </div>

                  {/* email */}
                  <div>
                    <label htmlFor="email" className={labelCls}>Email Address</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
                  </div>

                  {/* phone + country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className={labelCls}>Phone Number</label>
                      <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0300-1234567" />
                    </div>
                    <div>
                      <label htmlFor="country" className={labelCls}>Country</label>
                      <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls}>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CNIC */}
                  <div>
                    <label htmlFor="cnic" className={labelCls}>CNIC Number <span className="font-normal text-emerald-900/40">(Optional)</span></label>
                    <input id="cnic" type="text" inputMode="numeric" value={cnic} onChange={handleCnic} className={inputCls} placeholder="42101-1234567-1" maxLength={15} />
                    <p className="text-xs text-emerald-900/50 mt-1.5">Optional — or upload the CNIC picture below and it fills automatically.</p>

                    {/* CNIC front picture -> OCR auto-fill */}
                    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-emerald-900/20 bg-white/60 hover:border-[#0F766E]/60 transition px-4 py-4 mt-3">
                      <input type="file" accept="image/*" className="hidden" onChange={handleCnicUpload} />
                      {cnicScan.preview ? (
                        <div className="flex items-center gap-3">
                          <img src={cnicScan.preview} alt="CNIC front" className="w-16 h-12 object-cover rounded-lg border border-emerald-900/10 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {cnicScan.status === 'scanning' ? (
                              <p className="text-sm font-semibold text-[#0F766E] flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
                                Reading CNIC — this can take a few seconds…
                              </p>
                            ) : cnicScan.status === 'done' ? (
                              <p className="text-sm font-semibold text-emerald-700">Details auto-filled — please review them.</p>
                            ) : (
                              <p className="text-sm font-semibold text-amber-700">Couldn't read clearly — please type your details manually.</p>
                            )}
                            <p className="text-xs text-emerald-900/45 truncate mt-0.5">{cnicScan.fileName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <UploadIcon />
                          <div>
                            <p className="text-sm font-bold text-emerald-950/80">Upload CNIC Picture (Front Side)</p>
                            <p className="text-xs text-emerald-900/50 mt-0.5">JPG / PNG — clear, straight photo for best results</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* password + confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className={labelCls}>Password</label>
                      <div className="relative">
                        <input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls + ' pr-11'} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-900/40 hover:text-[#0F766E] transition-colors">
                          <EyeIcon off={showPw} />
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? barColor : 'bg-emerald-900/10'}`} />
                          ))}
                        </div>
                        {strengthLabel && (
                          <p className="text-xs mt-1 text-emerald-900/60">Strength: <span className="font-semibold">{strengthLabel}</span></p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirm" className={labelCls}>Confirm Password</label>
                      <div className="relative">
                        <input id="confirm" type={showPw2 ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls + ' pr-11'} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPw2(!showPw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-900/40 hover:text-[#0F766E] transition-colors">
                          <EyeIcon off={showPw2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0b3d2e] via-[#0F766E] to-[#0b3d2e] bg-[length:200%_100%] text-white font-bold tracking-wide hover:bg-[position:100%_0] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                >
                  {loading ? 'Creating your account...' : 'Create Account'}
                </button>

                <p className="text-[11px] text-emerald-900/45 text-center mt-3">
                  By creating an account you agree to our Terms & Privacy Policy.
                </p>
              </form>

              <p className="text-sm text-emerald-900/60 text-center mt-5">
                Already have an account?{' '}
                <a href="/login" className="font-bold text-[#0F766E] hover:underline">Login</a>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] max-w-sm px-5 py-3.5 rounded-2xl shadow-2xl animate-[icToast_.3s_ease-out_both] text-sm font-semibold ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'info' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
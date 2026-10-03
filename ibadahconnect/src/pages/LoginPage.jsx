import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import BrandLogo from "../components/BrandLogo";

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&display=swap');
@keyframes icFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
@keyframes icDrift { 0% { transform: translateX(-30vw); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(120vw); opacity: 0; } }
@keyframes icRise { 0% { transform: translateY(0px); opacity: 0; } 20% { opacity: 0.9; } 100% { transform: translateY(-120px); opacity: 0; } }
@keyframes icPulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
@keyframes icBounce { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(8px); } }
@keyframes icFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0px); } }
.ic-serif { font-family: 'Cinzel', Georgia, 'Times New Roman', serif; }
.ic-lattice {
  background-image:
    linear-gradient(45deg, rgba(212,175,55,0.07) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(212,175,55,0.07) 25%, transparent 25%);
  background-size: 44px 44px;
}
`;

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${((i * 61) % 90) + 5}%`,
  top: `${((i * 37) % 60) + 30}%`,
  size: 3 + (i % 3) * 2,
  delay: `${(i % 8) * 0.9}s`,
  dur: `${8 + (i % 5)}s`,
}));

const STARS = [
  { l: "18%", t: "16%", d: "0s" },
  { l: "78%", t: "12%", d: "1.2s" },
  { l: "85%", t: "40%", d: "2.1s" },
  { l: "10%", t: "46%", d: "0.8s" },
  { l: "72%", t: "68%", d: "1.6s" },
];

const ICON_SHIELD = (
  <svg className="h-6 w-6" fill="none" stroke="#D4AF37" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 2.6v5.1c0 4.6-3 8.9-7 10.3-4-1.4-7-5.7-7-10.3V5.6L12 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.2 12.2l2 2 3.8-4" />
  </svg>
);

const ICON_PIN = (
  <svg className="h-6 w-6" fill="none" stroke="#D4AF37" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.5-5.2-6.5-10.5a6.5 6.5 0 1113 0C18.5 15.8 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.3" />
  </svg>
);

const ICON_AWARD = (
  <svg className="h-6 w-6" fill="none" stroke="#D4AF37" strokeWidth="1.8" viewBox="0 0 24 24">
    <circle cx="12" cy="9" r="4.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.2L8 21l4-2.2L16 21l-1.5-7.8" />
  </svg>
);

const FEATURES = [
  { icon: ICON_SHIELD, title: "Verified Performers", desc: "Every performer is CNIC-verified and approved by the IbadahConnect team." },
  { icon: ICON_PIN, title: "GPS-Verified Proof", desc: "Live location and timestamped proof attached to every milestone." },
  { icon: ICON_AWARD, title: "Auto-Generated Certificates", desc: "Tamper-proof certificates issued automatically after completion." },
];

function KaabaArt() {
  return (
    <svg
      viewBox="0 0 220 220"
      className="h-52 w-52"
      style={{ animation: "icFloat 6s ease-in-out infinite", filter: "drop-shadow(0 24px 32px rgba(0,0,0,0.35))" }}
    >
      <ellipse cx="110" cy="196" rx="66" ry="12" fill="rgba(212,175,55,0.28)" />
      <polygon points="58,66 110,42 162,66 110,90" fill="#262626" />
      <polygon points="58,66 110,90 110,186 58,162" fill="#0c0c0c" />
      <polygon points="162,66 110,90 110,186 162,162" fill="#151515" />
      <polygon points="58,92 110,116 110,130 58,106" fill="#b8963a" />
      <polygon points="162,92 110,116 110,130 162,106" fill="#D4AF37" />
      <polygon points="132,120 150,111 150,164 132,173" fill="#D4AF37" opacity="0.92" />
      <polygon points="137,126 145,122 145,158 137,162" fill="#8a6d1f" opacity="0.55" />
    </svg>
  );
}

function CrescentArt() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-[#D4AF37]" style={{ animation: "icFloat 8s ease-in-out infinite" }}>
      <defs>
        <mask id="icCresMoon">
          <rect width="64" height="64" fill="white" />
          <circle cx="42" cy="24" r="19" fill="black" />
        </mask>
      </defs>
      <circle cx="30" cy="34" r="21" fill="currentColor" mask="url(#icCresMoon)" />
    </svg>
  );
}

const EYE = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EYE_OFF = (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.6 5.8A9.8 9.8 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 01-2.3 3.2M6.6 6.6A17 17 0 002.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 9.9a3 3 0 004.2 4.2" />
  </svg>
);

const inputCls =
  "w-full rounded-xl border border-emerald-900/15 bg-white/70 px-4 py-3 text-sm text-emerald-950 outline-none transition placeholder:text-emerald-900/30 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function LoginPage() {
  const [email, setEmail] = useState(localStorage.getItem("ic_remember_email") || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem("ic_remember_email"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && (u.id || u._id)) {
        const role = u.role || "Sponsor";
        window.location.href =
          role === "Admin" ? "/admin" : role === "Performer" ? "/performer-dashboard" : "/dashboard";
      }
    } catch (e) {}
  }, []);

  const scrollDown = () => {
    const el = document.getElementById("auth-features");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Invalid email or password.");
        setLoading(false);
        return;
      }
      const u = data.user || data;
      const shaped = { ...u, id: u.id || u._id, role: u.role || "Sponsor" };
      localStorage.setItem("user", JSON.stringify(shaped));
      if (data.token) localStorage.setItem("token", data.token);
      if (remember) localStorage.setItem("ic_remember_email", email.trim());
      else localStorage.removeItem("ic_remember_email");
      toast.success("Welcome back!");
      /* ⚡ NEW: ?next= support — checkout se aaye login ko wapas checkout pe bhejo (sirf Sponsor) */
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      const dest =
        next && next.startsWith("/") && shaped.role === "Sponsor"
          ? next
          : shaped.role === "Admin"
          ? "/admin"
          : shaped.role === "Performer"
          ? "/performer-dashboard"
          : "/dashboard";
      setTimeout(() => {
        window.location.href = dest;
      }, 800);
    } catch (err) {
      toast.error("Server not reachable. Please make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] font-outfit">
      <style>{STYLE}</style>

      {/* ===== TOP BAR (bold, like premium sites) ===== */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-[#F7F4EC]/85 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center">
            <BrandLogo variant="dark" size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="hidden text-sm font-semibold text-emerald-900/70 transition hover:text-emerald-800 sm:block">
              Back to Home
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/25 transition hover:scale-[1.03] hover:bg-emerald-700 active:scale-95"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ===== MAIN SPLIT ===== */}
      <div className="grid lg:grid-cols-2 lg:items-start">
        {/* LEFT — animated Islamic panel */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0b3d2e] via-[#0F766E] to-[#064e3b] lg:sticky lg:top-[72px] lg:flex lg:h-[calc(100vh-72px)] lg:min-h-0 lg:flex-col">
          <div className="ic-lattice absolute inset-0 opacity-70" />

          {/* drifting clouds */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-[12%] h-24 w-[340px] rounded-full bg-white/10 blur-2xl" style={{ animation: "icDrift 38s linear infinite" }} />
            <div className="absolute top-[38%] h-16 w-[260px] rounded-full bg-white/[0.07] blur-2xl" style={{ animation: "icDrift 55s linear infinite", animationDelay: "6s" }} />
            <div className="absolute top-[64%] h-20 w-[300px] rounded-full bg-white/[0.08] blur-2xl" style={{ animation: "icDrift 47s linear infinite", animationDelay: "12s" }} />
          </div>

          {/* rising golden particles */}
          <div className="pointer-events-none absolute inset-0">
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-[#D4AF37]"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  opacity: 0,
                  animation: `icRise ${p.dur} linear infinite`,
                  animationDelay: p.delay,
                }}
              />
            ))}
          </div>

          {/* twinkling stars + crescent */}
          <div className="pointer-events-none absolute inset-0">
            {STARS.map((s, i) => (
              <span
                key={i}
                className="absolute h-1 w-1 rounded-full bg-[#e7c96a]"
                style={{ left: s.l, top: s.t, animation: `icPulse 3s ease-in-out infinite`, animationDelay: s.d }}
              />
            ))}
          </div>
          <div className="absolute right-10 top-10">
            <CrescentArt />
          </div>

          {/* center content */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-10 pt-10 text-center" style={{ animation: "icFadeUp 0.9s ease-out both" }}>
            <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.35em] text-[#D4AF37]">IbadahConnect</p>
            <KaabaArt />
            <h1 className="ic-serif mt-8 text-4xl font-bold leading-snug text-white">
              Your Ibadah,
              <br />
              Performed with Trust.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
              Book Umrah, Hajj and Sadaqah — performed on your behalf by verified performers, with live tracking and tamper-proof certificates.
            </p>
          </div>

          {/* ayah */}
          <div className="relative z-10 shrink-0 px-10 pb-14 text-center">
            <p dir="rtl" className="ic-serif text-lg leading-loose text-[#e7c96a]">
              وَمَن يُعَظِّمْ شَعَائِرَ اللَّهِ فَإِنَّهَا مِن تَقْوَى الْقُلُوبِ
            </p>
            <p className="mt-2 text-xs text-white/60">
              "And whoever honors the symbols of Allah — indeed, it is from the piety of the hearts."
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/40">Surah Al-Hajj · 22:32</p>
          </div>

          {/* down button */}
          <button
            onClick={scrollDown}
            aria-label="Scroll down"
            className="absolute bottom-3 left-1/2 z-20 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white/10 text-[#D4AF37] ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
          >
            <span className="flex items-center justify-center" style={{ animation: "icBounce 1.8s ease-in-out infinite" }}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
        </div>

        {/* RIGHT — glass login card */}
        <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-12 sm:px-8">
          <div className="ic-lattice absolute inset-0 opacity-50" />
          <div className="relative z-10 w-full max-w-md" style={{ animation: "icFadeUp 0.8s ease-out both" }}>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl sm:p-10">
              {/* mobile logo */}
              <div className="mb-6 flex items-center justify-center lg:hidden">
                <BrandLogo variant="dark" size="md" />
              </div>

              <h2 className="ic-serif text-3xl font-bold text-emerald-950">Welcome Back</h2>
              <p className="mt-2 text-sm text-emerald-900/60">Login to manage your Ibadah requests.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-emerald-900/70">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-emerald-900/70">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`${inputCls} pr-11`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-900/40 transition hover:text-emerald-800"
                      aria-label="Toggle password visibility"
                    >
                      {showPass ? EYE_OFF : EYE}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-emerald-900/70">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-900/30 accent-emerald-700"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.error("Please email support@ibadahconnect.pk to reset your password.")}
                    className="text-xs font-bold text-emerald-700 transition hover:text-emerald-900"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-800/30 transition hover:scale-[1.02] hover:from-emerald-700 hover:to-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-emerald-900/60">
                New to IbadahConnect?{" "}
                <Link to="/register" className="font-bold text-emerald-700 transition hover:text-emerald-900">
                  Create an account
                </Link>
              </p>
            </div>
            <p className="mt-6 text-center text-[11px] text-emerald-900/40">Your credentials are encrypted and never shared.</p>
          </div>
        </div>
      </div>

      {/* ===== BELOW THE FOLD — features (down button scrolls here) ===== */}
      <section id="auth-features" className="bg-[#04241b] py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-[#D4AF37]/30">
                {f.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/55">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#04241b] py-6 text-center text-xs text-white/50">
        © 2026 IbadahConnect — Intelligent Ibadah Management Platform
      </footer>
    </div>
  );
}
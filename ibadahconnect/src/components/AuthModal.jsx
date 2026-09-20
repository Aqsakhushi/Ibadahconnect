import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaGoogle, FaApple, FaEye, FaEyeSlash, FaCheck, FaTimes, FaKaaba,
  FaHandHoldingHeart, FaGraduationCap, FaCheckCircle, FaInfoCircle,
  FaShieldAlt, FaHeart, FaPlane,
} from "react-icons/fa";

const API = "http://localhost:5000"; // backend ka URL (agar port alag ho to yahan change karna)

/* ================= CONSTANTS ================= */

const COUNTRIES = [
  { name: "Pakistan", dial: "+92" },
  { name: "India", dial: "+91" },
  { name: "Saudi Arabia", dial: "+966" },
  { name: "UAE", dial: "+971" },
  { name: "Qatar", dial: "+974" },
  { name: "Kuwait", dial: "+965" },
  { name: "Bahrain", dial: "+973" },
  { name: "Oman", dial: "+968" },
  { name: "Malaysia", dial: "+60" },
  { name: "Indonesia", dial: "+62" },
  { name: "Turkey", dial: "+90" },
  { name: "United Kingdom", dial: "+44" },
  { name: "United States", dial: "+1" },
];

const NAME_RE = /^[A-Za-z][A-Za-z .]{1,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STRENGTH_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e"];
const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@ibadah.com", password: "admin123" }, // tumhare backend ka asli admin
  { role: "Sponsor", email: "sponsor@demo.com", password: "sponsor123" },
  { role: "Performer", email: "performer@demo.com", password: "performer123" },
];

/* Google button ke liye demo account — pehli click pe khud ban jata hai */
const DEMO_GOOGLE = { name: "Google Demo User", email: "google.user@ibadahconnect.com", password: "Google@123" };

const EXPERIENCE_OPTIONS = [
  "Beginner (0-1 years)",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
  "Certified Scholar / Aalim",
];

/* ================= HELPERS ================= */

const destinationFor = (user = {}) => {
  const r = String(user.role || "sponsor").toLowerCase(); // 'Sponsor'/'Admin' capital bhi chalega
  if (r === "admin") return "/admin";
  if (r === "performer") return user.umrahProof ? "/performer-dashboard" : "/performer-onboarding";
  return "/dashboard";
};

/* FIX #1: backend "name" bhejta hai, Navbar "firstName" parhta hai — dono sync */
const normalizeUser = (u = {}) => {
  const full = (u.name || `${u.firstName || ""} ${u.lastName || ""}`).trim();
  const parts = full ? full.split(/\s+/) : [];
  return {
    ...u,
    name: full || "User",
    firstName: u.firstName || parts[0] || "User",
    lastName: u.lastName || parts.slice(1).join(" ") || "",
  };
};

const extractAuth = (data = {}) => {
  const d = data && data.data ? data.data : data || {};
  const token = d.token || d.accessToken || d.jwt || null;
  let user = null;
  if (d.user && typeof d.user === "object") user = d.user;
  else if (d._id || d.email) user = d;
  return { user, token };
};

const strengthScore = (pw = "") => {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10 || (/[A-Z]/.test(pw) && /[a-z]/.test(pw))) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 3);
};

const toAsciiDigits = (s = "") =>
  s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

/* ================= COMPONENT ================= */

export default function AuthModal(props) {
  const {
    open, isOpen, show, showModal, visible: visibleProp,
    onClose, onCloseModal, closeModal, hideModal,
    setShowModal, setShow, setIsOpen, setShowAuth,
  } = props;

  const navigate = useNavigate();
  const [selfOpen, setSelfOpen] = useState(false);
  const [tab, setTab] = useState("register");

  const controlled = open ?? isOpen ?? show ?? showModal ?? visibleProp ?? null;
  const visible = controlled !== null ? controlled : true;

  /* FIX #3: modal jis page pe khula, yaad rakho — login ke baad wahin wapis */
  const openPathRef = useRef(null);
  useEffect(() => {
    if (visible && openPathRef.current === null) {
      openPathRef.current = window.location.pathname;
    }
  }, [visible]);

  /* ---------- shared states ---------- */
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(null); // { title, msg, user, dest, countdown }

  /* ---------- login states ---------- */
  const [lem, setLem] = useState("");
  const [lpw, setLpw] = useState("");
  const [showLpw, setShowLpw] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);

  /* ---------- register states ---------- */
  const [role, setRole] = useState("sponsor");
  const [fn, setFn] = useState("");
  const [ln, setLn] = useState("");
  const [rem, setRem] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+92");
  const [country, setCountry] = useState("Pakistan");
  const [rpw, setRpw] = useState("");
  const [rpw2, setRpw2] = useState("");
  const [showRpw, setShowRpw] = useState(false);
  const [showRpw2, setShowRpw2] = useState(false);
  const [referral, setReferral] = useState("");
  const [agree, setAgree] = useState(false);
  const [regErr, setRegErr] = useState("");

  /* ---------- performer verification states ---------- */
  const [idNumber, setIdNumber] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState("Urdu, English");
  const [experience, setExperience] = useState("Beginner (0-1 years)");
  const [idDoc, setIdDoc] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [bio, setBio] = useState("");
  const [agreeVerify, setAgreeVerify] = useState(false);
  const [performerType, setPerformerType] = useState("Ibadah Team");

  /* ---------- OTP states ---------- */
  const [otpSent, setOtpSent] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const closeAll = () => {
    setSelfOpen(false);
    setSuccess(null);
    setNotice("");
    [onClose, onCloseModal, closeModal, hideModal, setShowModal, setShow, setIsOpen, setShowAuth].forEach((fn2) => {
      if (typeof fn2 === "function") fn2(false);
    });
  };

  /* FIX #3: login ke baad kahan bhejna hai
     1) sessionStorage.postLoginRedirect (CartPage set karegi)  → wahin jao
     2) modal jis page pe khula tha (cart/checkout/profile...)  → wahin wapis
     3) warna role ke hisaab se dashboard                        → default      */
  const resolveDest = (user) => {
    try {
      const stored = sessionStorage.getItem("postLoginRedirect");
      if (stored) {
        sessionStorage.removeItem("postLoginRedirect");
        return stored;
      }
    } catch (e) { /* ignore */ }
    const p = openPathRef.current || "/";
    const stay = ["/cart", "/checkout", "/wishlist", "/track", "/track-order", "/profile", "/personal-info", "/faq"];
    if (stay.some((s) => p === s || p.startsWith(s + "/"))) return p;
    return destinationFor(user);
  };

  const saveAuth = (rawUser, token) => {
    const user = normalizeUser(rawUser || {});
    localStorage.setItem("user", JSON.stringify(user));
    if (token) {
      localStorage.setItem("ibadahToken", token); // axios interceptor isi ko parhta hai
      localStorage.setItem("token", token);
    }
    return user;
  };

  /* success card countdown — 5s baad auto navigate */
  useEffect(() => {
    if (!success) return;
    if (success.countdown <= 0) {
      const dest = success.dest;
      closeAll();
      navigate(dest);
      return;
    }
    const t = setTimeout(() => setSuccess((s) => ({ ...s, countdown: s.countdown - 1 })), 1000);
    return () => clearTimeout(t);
  }, [success]);

  /* ---------- handlers ---------- */

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr("");
    setNotice("");
    if (!EMAIL_RE.test(lem)) return setLoginErr("Please enter a valid email address.");
    if (!lpw) return setLoginErr("Please enter your password.");
    setBusy(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email: lem.trim(), password: lpw });
      const { user: rawUser, token } = extractAuth(res.data);
      if (!rawUser) throw new Error("No user in response");
      const user = saveAuth(rawUser, token);
      setSuccess({
        title: "Welcome Back!",
        msg: `You are logged in as ${user.name}. Redirecting...`,
        user, dest: resolveDest(user), countdown: 5,
      });
    } catch (err) {
      setLoginErr(err?.response?.data?.message || err?.response?.data?.error || "Login failed. Check your email/password.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr("");
    setNotice("");
    if (!NAME_RE.test(fn)) return setRegErr("First name: 2-20 letters only.");
    if (!NAME_RE.test(ln)) return setRegErr("Last name: 2-20 letters required.");
    if (!EMAIL_RE.test(rem)) return setRegErr("Please enter a valid email address.");
    const digits = toAsciiDigits(phone).replace(/\D/g, "");
    const fullPhone = `${dialCode}${digits.replace(/^0+/, "")}`;
    if (digits.length < 9 || digits.length > 13) return setRegErr("Phone number must be 9-13 digits.");
    if (!otpVerified) return setRegErr("Please verify your phone number with the OTP first.");
    if (!country) return setRegErr("Please select your country.");
    if (rpw.length < 6) return setRegErr("Password must be at least 6 characters.");
    if (rpw !== rpw2) return setRegErr("Passwords do not match.");
    if (!agree) return setRegErr("Please accept the Terms & Conditions.");
    if (role === "performer") {
      if (!idNumber.trim()) return setRegErr("Please enter your CNIC / Passport number.");
      if (!city.trim()) return setRegErr("Please enter your city.");
      if (!bio || bio.trim().length < 10) return setRegErr("Bio must be at least 10 characters.");
      if (!idDoc) return setRegErr("Please upload your ID document (CNIC / Passport).");
      if (!agreeVerify) return setRegErr("Please confirm the verification consent.");
    }
    setBusy(true);
    try {
      const payload = {
        name: `${fn.trim()} ${ln.trim()}`.trim(),
        firstName: fn.trim(),
        lastName: ln.trim(),
        email: rem.trim(),
        phone: fullPhone,
        country,
        city: city.trim(),
        password: rpw,
        role: role === "performer" ? "Performer" : "Sponsor",
        performerType: role === "performer" ? performerType : undefined,
        referralCode: referral.trim(),
        idNumber: idNumber.trim(),
        languages,
        experience,
        bio: bio.trim(),
        hasIdDoc: !!idDoc,
        hasProfilePhoto: !!photo,
      };
      const sRes = await axios.post(`${API}/api/auth/signup`, payload);
      let { user: rawUser, token } = extractAuth(sRes.data);
      if (!token) {
        const res = await axios.post(`${API}/api/auth/login`, { email: rem.trim(), password: rpw });
        const lAuth = extractAuth(res.data);
        rawUser = lAuth.user || rawUser;
        token = lAuth.token;
      }
      const user = saveAuth(rawUser || { name: payload.name, email: payload.email, role }, token);
      setSuccess({
        title: "Account Created!",
        msg: `Welcome ${user.firstName}! Your ${role} account has been created. Redirecting...`,
        user, dest: resolveDest(user), countdown: 5,
      });
    } catch (err) {
      setRegErr(err?.response?.data?.message || err?.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /* FIX #2: Google button ab sach mein login karta hai (demo account auto-created) */
  const googleDemoLogin = async () => {
    setLoginErr("");
    setRegErr("");
    setNotice("");
    setBusy(true);
    const creds = { email: DEMO_GOOGLE.email, password: DEMO_GOOGLE.password };
    try {
      let res;
      try {
        res = await axios.post(`${API}/api/auth/login`, creds);
      } catch (e1) {
        // pehli dafa — demo Google account banao, phir login karo
        await axios.post(`${API}/api/auth/signup`, {
          name: DEMO_GOOGLE.name,
          firstName: "Google",
          lastName: "User",
          email: DEMO_GOOGLE.email,
          password: DEMO_GOOGLE.password,
          role: "Sponsor",
          country: "Pakistan",
          phone: "+923000000000",
        });
        res = await axios.post(`${API}/api/auth/login`, creds);
      }
      const { user: rawUser, token } = extractAuth(res.data);
      if (!rawUser) throw new Error("No user in response");
      const user = saveAuth(rawUser, token);
      setSuccess({
        title: "Signed in with Google",
        msg: `Demo Google sign-in successful as ${user.name}. Redirecting...`,
        user, dest: resolveDest(user), countdown: 5,
      });
    } catch (err) {
      const m = err?.response?.data?.message || "Google demo sign-in failed. Please use email login.";
      setNotice(m);
    } finally {
      setBusy(false);
    }
  };

  const socialClick = (name) => {
    if (name === "Google") return googleDemoLogin();
    setNotice(`${name} sign-in is not configured in this FYP demo. Please use email login or Google.`);
  };

  const sendOtp = () => {
    const digits = toAsciiDigits(phone).replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13) return setRegErr("Phone number must be 9-13 digits first.");
    setRegErr("");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpSent(code);
    setOtpInput("");
    setOtpVerified(false);
  };

  const verifyOtp = () => {
    if (otpSent && otpInput.trim() === otpSent) {
      setOtpVerified(true);
      setRegErr("");
    } else {
      setRegErr("Invalid OTP. Please check the demo code above.");
    }
  };

  const onPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  /* ---------- shared JSX bits ---------- */
  const inputCls = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500";

  const sc = strengthScore(rpw);
  const strengthBars = (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= sc ? STRENGTH_COLORS[sc] : "#e5e7eb" }} />
        ))}
      </div>
      <p className="text-[11px] mt-1 font-semibold" style={{ color: STRENGTH_COLORS[sc] }}>{STRENGTH_LABELS[sc]}</p>
    </div>
  );

  const matchBadge = rpw === rpw2 ? (
    <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1"><FaCheck /> Passwords match</p>
  ) : (
    <p className="text-[11px] text-red-500 font-semibold mt-2 flex items-center gap-1"><FaTimes /> Not matching</p>
  );

  const socialRow = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => socialClick("Google")} disabled={busy}
        className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-full py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        <FaGoogle className="text-[#DB4437]" /> Continue with Google
      </button>
      <button type="button" onClick={() => socialClick("Apple")} disabled={busy}
        className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-full py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
        <FaApple className="text-gray-900" /> Apple
      </button>
    </div>
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAll} />

      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        {/* close */}
        <button onClick={closeAll} className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center">
          <FaTimes />
        </button>

        {/* LEFT — brand panel */}
        <div className="hidden md:flex md:w-[42%] bg-primary text-white flex-col justify-between p-10">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <FaKaaba className="text-2xl" />
              <span className="font-bold text-lg tracking-wide">IbadahConnect</span>
            </div>
            <h1 className="text-4xl leading-snug font-bold" style={{ fontFamily: "'Amiri', serif" }}>
              Perform Sacred Ibadah<br />
              <span className="italic text-emerald-200">On Your Behalf</span>
            </h1>
            <div className="mt-8 space-y-4 text-sm text-emerald-50/90">
              <div className="flex items-start gap-3"><FaShieldAlt className="mt-0.5" /> Verified performers for Umrah, Hajj &amp; charity Badal</div>
              <div className="flex items-start gap-3"><FaHeart /> Sponsor ibadah for loved ones — near or far</div>
              <div className="flex items-start gap-3"><FaPlane /> Real-time tracking from niyyah to completion</div>
            </div>
          </div>
          <div className="flex gap-8">
            <div><p className="text-2xl font-bold">500+</p><p className="text-xs text-emerald-100/80">Verified Performers</p></div>
            <div><p className="text-2xl font-bold">120+</p><p className="text-xs text-emerald-100/80">Ibadah Completed</p></div>
            <div><p className="text-2xl font-bold">4.9★</p><p className="text-xs text-emerald-100/80">Average Rating</p></div>
          </div>
        </div>

        {/* RIGHT — forms */}
        <div className="flex-1 overflow-y-auto p-5 md:p-10">
          {success ? (
            /* ---------- SUCCESS CARD ---------- */
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <FaCheckCircle className="text-emerald-600 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{success.title}</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-xs">{success.msg}</p>
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Redirecting in {success.countdown}s...
              </div>
              <button type="button" onClick={() => { const d = success.dest; closeAll(); navigate(d); }}
                className="mt-4 text-sm font-bold text-emerald-700 underline">
                Continue now
              </button>
            </div>
          ) : (
            <>
              {notice && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-3 py-2 mb-4">
                  <FaInfoCircle className="mt-0.5 shrink-0" /> {notice}
                </div>
              )}

              {/* tabs */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full mb-6">
                <button type="button" onClick={() => setTab("login")}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition ${tab === "login" ? "bg-primary text-white shadow" : "text-gray-500 hover:text-gray-700"}`}>
                  Login
                </button>
                <button type="button" onClick={() => setTab("register")}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition ${tab === "register" ? "bg-primary text-white shadow" : "text-gray-500 hover:text-gray-700"}`}>
                  Register
                </button>
              </div>

              {/* ================= LOGIN ================= */}
              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                  <p className="text-sm text-gray-500 -mt-2">Login to continue your ibadah journey.</p>

                  {loginErr && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{loginErr}</div>}

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <input type="email" value={lem} onChange={(e) => setLem(e.target.value)} placeholder="you@example.com" className={inputCls + " mt-1"} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600">Password</label>
                    <div className="relative mt-1">
                      <input type={showLpw ? "text" : "password"} value={lpw} onChange={(e) => setLpw(e.target.value)} placeholder="Your password" className={inputCls + " pr-10"} />
                      <button type="button" onClick={() => setShowLpw(!showLpw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showLpw ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={busy} className="w-full bg-accent text-white font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50">
                    {busy ? "Please wait..." : "Login"}
                  </button>

                  {socialRow}

                  {/* FYP demo accounts — sirf login tab, collapsed */}
                  <div className="border border-dashed border-gray-300 rounded-xl">
                    <button type="button" onClick={() => setDemoOpen(!demoOpen)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 font-semibold">
                      <FaGraduationCap className="text-amber-500" /> FYP Demo Accounts (presentation only)
                      <span className="ml-auto text-xs">{demoOpen ? "▲" : "▼"}</span>
                    </button>
                    {demoOpen && (
                      <div className="px-4 pb-3 space-y-2">
                        {DEMO_ACCOUNTS.map((d) => (
                          <button key={d.role} type="button" onClick={() => { setLem(d.email); setLpw(d.password); }}
                            className="w-full flex items-center justify-between text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="font-bold text-gray-700">{d.role}</span>
                            <span className="text-gray-500">{d.email} / {d.password}</span>
                          </button>
                        ))}
                        <p className="text-[11px] text-gray-400">Click any row to autofill. Replace these with your real DB credentials before final demo.</p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    New here?{" "}
                    <button type="button" onClick={() => setTab("register")} className="text-emerald-700 font-bold">Create Account</button>
                  </p>
                </form>
              ) : (
                /* ================= REGISTER ================= */
                <form onSubmit={handleRegister} className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                  <p className="text-sm text-gray-500 -mt-2">Join IbadahConnect as a Sponsor or Performer.</p>

                  {regErr && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">{regErr}</div>}

                  {/* role cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole("sponsor")}
                      className={`border-2 rounded-xl p-4 text-left transition ${role === "sponsor" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <FaHandHoldingHeart className={`text-xl mb-2 ${role === "sponsor" ? "text-emerald-600" : "text-gray-400"}`} />
                      <p className="font-bold text-sm text-gray-800">Sponsor</p>
                      <p className="text-[11px] text-gray-500">Book ibadah on my behalf</p>
                    </button>
                    <button type="button" onClick={() => setRole("performer")}
                      className={`border-2 rounded-xl p-4 text-left transition ${role === "performer" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <FaKaaba className={`text-xl mb-2 ${role === "performer" ? "text-emerald-600" : "text-gray-400"}`} />
                      <p className="font-bold text-sm text-gray-800">Performer</p>
                      <p className="text-[11px] text-gray-500">I perform ibadah for others</p>
                    </button>
                  </div>

                  {/* names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">First Name</label>
                      <input value={fn} onChange={(e) => setFn(e.target.value)} placeholder="Ayesha" className={inputCls + " mt-1"} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Last Name</label>
                      <input value={ln} onChange={(e) => setLn(e.target.value)} placeholder="Khan" className={inputCls + " mt-1"} />
                    </div>
                  </div>

                  {/* email */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Email</label>
                    <div className="relative mt-1">
                      <input type="email" value={rem} onChange={(e) => setRem(e.target.value)} placeholder="you@example.com" className={inputCls + " pr-10"} />
                      {EMAIL_RE.test(rem) && <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                    </div>
                  </div>

                  {/* phone + demo OTP */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Phone Number</label>
                    <div className="flex gap-2 mt-1">
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                        style={{ width: "112px", flexShrink: 0 }}
                      >
                        <option value="+92">PK +92</option>
                        <option value="+93">AF +93</option>
                        <option value="+91">IN +91</option>
                        <option value="+971">AE +971</option>
                        <option value="+966">SA +966</option>
                        <option value="+60">MY +60</option>
                        <option value="+62">ID +62</option>
                        <option value="+44">UK +44</option>
                        <option value="+1">US +1</option>
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => {
                          setPhone(toAsciiDigits(e.target.value).replace(/[^\d\s]/g, ""));
                          setOtpSent("");
                          setOtpInput("");
                          setOtpVerified(false);
                        }}
                        placeholder="300 1234567"
                        className={inputCls + " flex-1 min-w-0"}
                      />
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={busy}
                        className="px-4 rounded-lg text-sm font-bold text-white bg-accent hover:opacity-90 disabled:opacity-50 shrink-0 whitespace-nowrap"
                      >
                        Send OTP
                      </button>
                    </div>

                    {otpSent && !otpVerified && (
                      <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          Demo OTP generated (no real SMS in FYP demo). Your code:{" "}
                          <span className="font-bold tracking-[0.3em]">{otpSent}</span>
                        </p>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={otpInput}
                            onChange={(e) => setOtpInput(toAsciiDigits(e.target.value).replace(/\D/g, "").slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            className={inputCls + " flex-1 min-w-0"}
                          />
                          <button
                            type="button"
                            onClick={verifyOtp}
                            className="px-4 rounded-lg text-sm font-bold text-white bg-primary hover:opacity-90 whitespace-nowrap"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}

                    {otpVerified && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                        <FaCheckCircle /> Phone verified — you can create your account now.
                      </p>
                    )}
                  </div>

                  {/* country */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Country</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls + " mt-1"}>
                      {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* password + confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Password</label>
                      <div className="relative mt-1">
                        <input type={showRpw ? "text" : "password"} value={rpw} onChange={(e) => setRpw(e.target.value)} placeholder="Min 6 characters" className={inputCls + " pr-10"} />
                        <button type="button" onClick={() => setShowRpw(!showRpw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showRpw ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {rpw && strengthBars}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Confirm Password</label>
                      <div className="relative mt-1">
                        <input type={showRpw2 ? "text" : "password"} value={rpw2} onChange={(e) => setRpw2(e.target.value)} placeholder="Re-enter password" className={inputCls + " pr-10"} />
                        <button type="button" onClick={() => setShowRpw2(!showRpw2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showRpw2 ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {rpw2 && matchBadge}
                    </div>
                  </div>

                  {/* sponsor referral */}
                  {role === "sponsor" && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Referral Code (optional)</label>
                      <input value={referral} onChange={(e) => setReferral(e.target.value)} placeholder="Enter sponsor referral code" className={inputCls + " mt-1"} />
                    </div>
                  )}

                  {/* performer verification block */}
                  {role === "performer" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><FaShieldAlt /> Performer Verification</p>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Performer Type</label>
                        <select value={performerType} onChange={(e) => setPerformerType(e.target.value)} className={inputCls + " mt-1 bg-white"}>
                          <option value="Ibadah Team">Ibadah Team (official team member)</option>
                          <option value="Self/Family">Self / Family (perform yourself or family member)</option>
                        </select>
                      </div>
                      <p className="text-[11px] text-amber-700 -mt-1">These details build trust with sponsors. Documents are stored locally for this demo.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">CNIC / Passport Number</label>
                          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. 42101-1234567-1" className={inputCls + " mt-1 bg-white"} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">City</label>
                          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Karachi" className={inputCls + " mt-1 bg-white"} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Languages</label>
                          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className={inputCls + " mt-1 bg-white"} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">Experience</label>
                          <select value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls + " mt-1 bg-white"}>
                            {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="border border-dashed border-amber-300 bg-white rounded-lg p-3 flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setIdDoc(e.target.files?.[0] || null)} />
                          <FaShieldAlt className="text-amber-500 shrink-0" />
                          <span className="truncate">{idDoc ? idDoc.name : "Upload ID Document (CNIC / Passport)"}</span>
                        </label>
                        <label className="border border-dashed border-amber-300 bg-white rounded-lg p-3 flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                          <FaShieldAlt className="text-amber-500 shrink-0" />
                          <span className="truncate">{photo ? photo.name : "Upload Profile Photo"}</span>
                        </label>
                      </div>
                      {photoPreview && (
                        <div className="flex items-center gap-2">
                          <img src={photoPreview} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-amber-300" />
                          <span className="text-[11px] text-gray-500">Photo preview</span>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Short Bio</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
                          placeholder="Tell sponsors about your ibadah experience (min 10 characters)" className={inputCls + " mt-1 bg-white"} />
                      </div>
                      <label className="flex items-start gap-2 text-xs text-gray-600">
                        <input type="checkbox" checked={agreeVerify} onChange={(e) => setAgreeVerify(e.target.checked)} className="mt-0.5 accent-amber-600" />
                        <span>I confirm my documents are genuine and I consent to identity verification by IbadahConnect.</span>
                      </label>
                    </div>
                  )}

                  {/* terms */}
                  <label className="flex items-start gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-emerald-600" />
                    <span>I agree to the <b>Terms &amp; Conditions</b> and <b>Privacy Policy</b> of IbadahConnect.</span>
                  </label>

                  <button type="submit" disabled={busy} className="w-full bg-accent text-white font-bold py-3 rounded-full hover:opacity-90 disabled:opacity-50">
                    {busy ? "Creating account..." : role === "performer" ? "Create Performer Account" : "Create Sponsor Account"}
                  </button>

                  {socialRow}

                  <p className="text-sm text-gray-500 text-center">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setTab("login")} className="text-emerald-700 font-bold">Login</button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
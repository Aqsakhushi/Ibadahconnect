import { useState } from 'react';

const MSGS_KEY = 'ic_support_msgs';
const getMsgs = () => { try { return JSON.parse(localStorage.getItem(MSGS_KEY)) || []; } catch (e) { return []; } };

const FAQS = [
  { q: 'What is Ibadah Badal?', a: 'Ibadah Badal means performing Umrah or Hajj on behalf of someone who cannot do it themselves due to old age, illness, or disability. A verified performer travels and completes the Ibadah with the proper intention on their behalf.' },
  { q: 'How are performers verified?', a: 'Every performer goes through email verification and admin approval. CNIC verification adds an extra trust layer, and each performer is limited to one active task per day to ensure full focus on your Ibadah.' },
  { q: 'How does performer assignment work?', a: 'When you place an order, the system automatically assigns the best eligible performer based on verification status, CNIC trust score, and city match. If no performer is available, our team assigns one manually.' },
  { q: 'How do payments work?', a: 'You can pay through JazzCash, EasyPaisa, or bank card. Your payment is recorded against the order, and progress updates begin as soon as the Ibadah starts.' },
  { q: 'Will I get proof of completion?', a: 'Yes. Every order includes milestone-based progress updates, and a completion certificate is generated once the Ibadah is finished, so you always have documented proof.' },
  { q: 'Can I track my order?', a: 'Absolutely. Open My Orders from your dashboard to see live status, assigned performer, and milestone progress for every booking.' },
];

const SUBJECTS = ['Order Issue', 'Payment Question', 'Performer Related', 'Certificate Request', 'Other'];

const HelpSupport = () => {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch (e) { return null; }
  });
  const [openIdx, setOpenIdx] = useState(null);
  const [msgs, setMsgs] = useState(getMsgs);
  const [form, setForm] = useState({ name: user?.firstName || '', email: user?.email || '', subject: SUBJECTS[0], message: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sentRef, setSentRef] = useState(null);

  const setField = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(''); };

  const submit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.message.trim().length < 10) {
      setError('Please write a bit more so we can help you properly (at least 10 characters).');
      return;
    }
    setError('');
    setSending(true);
    setTimeout(() => {
      const rec = { ref: `SUP-${Date.now()}`, ...form, date: new Date().toISOString() };
      const next = [rec, ...msgs];
      setMsgs(next);
      localStorage.setItem(MSGS_KEY, JSON.stringify(next));
      setSentRef(rec.ref);
      setSending(false);
      setForm((f) => ({ ...f, subject: SUBJECTS[0], message: '' }));
    }, 900);
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-gray-900">Help &amp; Support</h1>
        <p className="text-gray-500 mt-1">Questions about Ibadah Badal, orders, or payments — we are here to help.</p>

        {/* Contact info cards */}
        <div className="grid sm:grid-cols-3 gap-3 mt-8">
          {[
            { title: 'Email Us', value: 'support@ibadahconnect.com' },
            { title: 'Response Time', value: 'Within 24 hours' },
            { title: 'Support Hours', value: 'Mon - Sat, 9am - 9pm PKT' },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{c.title}</p>
              <p className="text-sm font-semibold text-[#1B5E20] mt-1 break-words">{c.value}</p>
            </div>
          ))}
        </div>

        {/* FAQ accordion */}
        <h2 className="text-xl font-bold text-gray-900 mt-10">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-3">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm transition-all ${open ? 'border-[#1B5E20]/30' : 'border-gray-100'}`}>
                <button onClick={() => setOpenIdx(open ? null : i)} className="w-full flex items-center justify-between gap-3 text-left px-5 py-4">
                  <span className="text-sm font-bold text-gray-900">{f.q}</span>
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {open && <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{f.a}</p>}
              </div>
            );
          })}
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-10">
          <h2 className="text-lg font-bold text-gray-900">Send Us a Message</h2>
          <p className="text-sm text-gray-400 mt-0.5">Our team will get back to you on your email.</p>

          {sentRef ? (
            <div className="mt-5 bg-emerald-50/60 rounded-2xl p-6 text-center ring-1 ring-emerald-100">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-900 mt-3">Message sent successfully!</p>
              <p className="text-xs text-gray-400 mt-1">Reference: {sentRef} — we will reply within 24 hours.</p>
              <button onClick={() => setSentRef(null)} className="mt-4 px-5 py-2 rounded-full bg-[#1B5E20] text-white text-sm font-bold">
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Name</label>
                  <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#1B5E20] focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@example.com"
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#1B5E20] focus:outline-none" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Subject</label>
                <select value={form.subject} onChange={(e) => setField('subject', e.target.value)}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#1B5E20] focus:outline-none bg-white">
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="mt-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Message</label>
                <textarea rows="4" value={form.message} onChange={(e) => setField('message', e.target.value)} placeholder="Describe your issue or question..."
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#1B5E20] focus:outline-none resize-none" />
              </div>
              {error && <p className="text-sm font-semibold text-red-500 mt-3">{error}</p>}
              <button onClick={submit} disabled={sending}
                className="mt-4 px-6 py-3 rounded-full bg-[#1B5E20] text-white text-sm font-bold ring-1 ring-[#D4AF37]/60 hover:bg-[#2E7D32] transition-all disabled:opacity-60">
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </>
          )}
        </div>

        {/* Message history */}
        {msgs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-900">Your Previous Messages</h2>
            <div className="mt-4 space-y-2">
              {msgs.map((m) => (
                <div key={m.ref} className="flex items-center justify-between gap-3 flex-wrap bg-gray-50/60 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{m.subject}</p>
                    <p className="text-xs text-gray-400">{m.ref} — {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold ring-1 ring-emerald-100">Submitted</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;
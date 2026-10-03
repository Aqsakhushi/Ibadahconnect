import { useState, useEffect } from 'react';

const KEY = 'ic_donations';
const getHistory = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };

const IconHeart = () => (<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7.5-4.7-9.8-9.2C.7 8.6 2.6 5 6.1 5c2.1 0 3.5 1.1 4.4 2.6h3c.9-1.5 2.3-2.6 4.4-2.6 3.5 0 5.4 3.6 3.9 6.8C19.5 16.3 12 21 12 21z" /></svg>);
const IconBox = () => (<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></svg>);
const IconStar = () => (<svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.3 6.4 20.3l1.2-6.3L3 9.6l6.3-.8L12 3z" /></svg>);

const CAUSES = [
  { id: 'umrah', title: 'Sponsor an Umrah', desc: 'Fund a complete Umrah Badal for an elderly or disabled person.', suggested: 25000, Icon: IconStar },
  { id: 'food', title: 'Feed a Pilgrim', desc: 'Provide meals to pilgrims during their sacred journey.', suggested: 1000, Icon: IconBox },
  { id: 'general', title: 'General Sadaqah', desc: 'Contribute wherever the need is the greatest.', suggested: 5000, Icon: IconHeart },
];

const PRESETS = [500, 1000, 5000, 10000];
const METHODS = [
  { id: 'JazzCash', desc: 'Mobile wallet' },
  { id: 'EasyPaisa', desc: 'Mobile wallet' },
  { id: 'Bank Card', desc: 'Debit / Credit' },
];

const Donations = () => {
  const [history, setHistory] = useState(getHistory);
  const [causeId, setCauseId] = useState('umrah');
  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState('');
  const [method, setMethod] = useState('JazzCash');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const cause = CAUSES.find((c) => c.id === causeId);
  const total = history.reduce((s, d) => s + Number(d.amount || 0), 0);

  const setPreset = (v) => { setAmount(v); setCustom(''); setError(''); };

  const donate = () => {
    const finalAmount = custom ? Number(custom) : amount;
    if (!finalAmount || finalAmount < 100) {
      setError('Minimum donation amount is PKR 100.');
      return;
    }
    setError('');
    setProcessing(true);
    setTimeout(() => {
      const rec = {
        ref: `DON-${Date.now()}`,
        cause: cause.title,
        amount: finalAmount,
        method,
        date: new Date().toISOString(),
      };
      const next = [rec, ...history];
      setHistory(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      setSuccess(rec);
      setProcessing(false);
    }, 1400);
  };

  const reset = () => { setSuccess(null); setCustom(''); setError(''); };

  return (
    <div className="min-h-screen bg-gray-50/60 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
        <p className="text-gray-500 mt-1">Give Sadaqah — help someone perform Ibadah who cannot do it themselves.</p>

        {success ? (
          <div className="mt-8 bg-white rounded-2xl border border-emerald-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-4">Thank You!</h2>
            <p className="text-gray-500 mt-1">Your donation of <span className="font-bold text-[#1B5E20]">PKR {Number(success.amount).toLocaleString('en-PK')}</span> towards <span className="font-bold">{success.cause}</span> has been recorded.</p>
            <p className="text-xs font-bold text-gray-400 mt-2 tracking-wider">Reference: {success.ref} — {success.method}</p>
            <button onClick={reset} className="mt-5 px-6 py-2.5 rounded-full bg-[#1B5E20] text-white text-sm font-bold hover:bg-[#2E7D32] transition-colors">
              Donate Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {CAUSES.map((c) => {
                const active = c.id === causeId;
                const Icon = c.Icon;
                return (
                  <button key={c.id} onClick={() => { setCauseId(c.id); setAmount(c.suggested); setError(''); }}
                    className={`text-left bg-white rounded-2xl border p-5 shadow-sm transition-all ${active ? 'border-[#1B5E20] ring-2 ring-[#1B5E20]/20 shadow-md' : 'border-gray-100 hover:border-[#1B5E20]/40'}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${active ? 'bg-[#1B5E20] text-[#D4AF37]' : 'bg-emerald-50 text-[#1B5E20]'}`}>
                      <Icon />
                    </div>
                    <h3 className="font-bold text-gray-900 mt-3">{c.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                    <p className="text-xs font-bold text-[#8a6d1a] mt-2">Suggested: PKR {c.suggested.toLocaleString('en-PK')}</p>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
              <p className="text-sm font-bold text-gray-900">Choose amount (PKR)</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {PRESETS.map((v) => (
                  <button key={v} onClick={() => setPreset(v)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!custom && amount === v ? 'bg-[#1B5E20] text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#1B5E20]/40'}`}>
                    {v.toLocaleString('en-PK')}
                  </button>
                ))}
                <input
                  type="number"
                  min="100"
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setError(''); }}
                  placeholder="Custom amount"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 focus:border-[#1B5E20] focus:outline-none w-40"
                />
              </div>

              <p className="text-sm font-bold text-gray-900 mt-6">Payment method</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {METHODS.map((m) => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${method === m.id ? 'border-[#1B5E20] bg-emerald-50/50 ring-1 ring-[#1B5E20]/20' : 'border-gray-200 hover:border-[#1B5E20]/40'}`}>
                    <p className="text-sm font-bold text-gray-900">{m.id}</p>
                    <p className="text-xs text-gray-400">{m.desc}</p>
                  </button>
                ))}
              </div>

              {error && <p className="text-sm font-semibold text-red-500 mt-4">{error}</p>}

              <button onClick={donate} disabled={processing}
                className="w-full mt-6 py-3.5 rounded-full bg-[#1B5E20] text-white font-bold text-sm ring-1 ring-[#D4AF37]/60 hover:bg-[#2E7D32] transition-all disabled:opacity-60">
                {processing ? 'Processing...' : `Donate ${custom ? `PKR ${Number(custom).toLocaleString('en-PK')}` : `PKR ${Number(amount).toLocaleString('en-PK')}`}`}
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2">Demo payments — no real money is charged.</p>
            </div>
          </>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-900">Your Donation History</h2>
            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#8a6d1a] text-xs font-bold ring-1 ring-[#D4AF37]/40">
              Total: PKR {total.toLocaleString('en-PK')}
            </span>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 mt-3">No donations yet — your contributions will appear here.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.map((d) => (
                <div key={d.ref} className="flex items-center justify-between gap-3 flex-wrap bg-gray-50/60 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{d.cause}</p>
                    <p className="text-xs text-gray-400">{d.ref} — {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1B5E20]">PKR {Number(d.amount).toLocaleString('en-PK')}</p>
                    <p className="text-xs text-gray-400">{d.method}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Donations;
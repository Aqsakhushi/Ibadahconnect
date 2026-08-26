import { useState } from 'react';

const HowItWorksPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const steps = [
    { title: "Reach out", desc: "Visit our platform and explore the various Islamic services we offer, including Umrah Badal, Hajj Badal, and Sadaqah donations." },
    { title: "Choose a Package", desc: "Select a package that suits your needs. Provide the details of the deceased or beneficiary and complete the secure checkout process." },
    { title: "Confirmation", desc: "Once your booking is confirmed, our team assigns a verified performer (Mutawalli) based in Makkah to execute the Ibadah on your behalf." },
    { title: "Completion", desc: "The performer completes the rituals (Ehram, Tawaf, Sa'i, etc.) and uploads video proofs. You receive a final completion notification with all the evidence." }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-3" style={{ fontFamily: 'Amiri, serif' }}>How It Works</h1>
        <p className="text-gray-500 max-w-xl mx-auto">A simple 4-step process to fulfill your sacred duties on behalf of your loved ones.</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">{idx + 1}</span>
                <h2 className="text-lg font-bold text-gray-900">{step.title}</h2>
              </div>
              <svg className={`w-6 h-6 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-6 pl-20 text-gray-600 leading-relaxed text-sm">
                {step.desc}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorksPage;
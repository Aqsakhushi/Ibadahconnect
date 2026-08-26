import { useState } from 'react';

const FAQsPage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    { q: "What is Umrah Badal?", a: "Umrah Badal is the act of performing Umrah on behalf of someone who is unable to do so themselves. This could be due to illness, old age, or death. It allows the individual to receive the spiritual benefits of the pilgrimage." },
    { q: "Can Umrah Badal be performed for a deceased person?", a: "Yes, it is a highly recommended practice to perform Umrah for someone who has passed away, especially if they had intended to perform it but were unable to do so." },
    { q: "Is performing Umrah Badal permissible in Islam?", a: "Yes, it is widely accepted by Islamic scholars and jurisprudence based on the principle that acts of worship can be performed on behalf of others, especially for the deceased." },
    { q: "How will I know the Umrah has been performed?", a: "Upon completion, you will receive a video of the performer executing the rituals (Tawaf, Sa'i, etc.) on behalf of your specified beneficiary, ensuring 100% transparency." },
    { q: "Who performs the Umrah?", a: "Our team consists of verified students of knowledge residing in Makkah. They perform the rituals with the correct intention (Niyyah) on behalf of your loved one." }
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-3" style={{ fontFamily: 'Amiri, serif' }}>Frequently Asked Questions</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Everything you need to know about IbadahConnect services.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-bold text-gray-900">{faq.q}</h2>
              <svg className={`w-6 h-6 text-gray-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-6 text-gray-600 leading-relaxed text-sm">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQsPage;
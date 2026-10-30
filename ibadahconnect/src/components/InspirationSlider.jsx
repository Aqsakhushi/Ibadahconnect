import { useState, useEffect } from 'react';

const InspirationSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const inspirations = [
    { title: "Hadith of the Day", text: "رسول اللہ ﷺ نے فرمایا :’’ جنت کے آٹھ دروازے ہیں ، ان میں سے ایک دروازے کا نام ’’ الریان ‘‘ ہے ، اس میں سے صرف روزہ دار ہی داخل ہوں گے ۔‘‘", img: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=1600&auto=format&fit=crop" },
    { title: "Ayat of the Day", text: "اے ایمان والو ! تم پر روزے فرض کردیئے گئے ہیں ، جس طرح تم سے پہلے لوگوں پر فرض کیے گئے تھے ، تاکہ تمہارے اندر تقوی پیدا ہو", img: "https://images.unsplash.com/photo-1565728744382-61accd4aa148?q=80&w=1600&auto=format&fit=crop" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % inspirations.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-lg mb-2">
      {inspirations.map((ins, idx) => (
        <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100' : 'opacity-0'}`}>
          <img src={ins.img} alt={ins.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent flex items-center">
            <div className="p-6 md:p-10 max-w-xl">
              <span className="inline-block bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-widest">{ins.title}</span>
              <p className="text-white text-sm md:text-base font-medium leading-relaxed" style={{ fontFamily: 'Amiri, serif' }}>{ins.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InspirationSlider;
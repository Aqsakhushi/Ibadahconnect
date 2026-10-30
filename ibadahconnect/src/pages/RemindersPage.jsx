import { FaRegClock, FaBook, FaBookOpen } from 'react-icons/fa';

const RemindersPage = () => {
  const prayers = [
    { name: "Fajr", time: "05:15 AM" },
    { name: "Dhuhr", time: "12:30 PM" },
    { name: "Asr", time: "04:45 PM" },
    { name: "Maghrib", time: "06:15 PM" },
    { name: "Isha", time: "07:45 PM" }
  ];

  return (
    <div className="bg-[#0a1a14] text-white min-h-[calc(100vh-4rem)] rounded-3xl">
      <div className="max-w-6xl mx-auto p-8 md:p-12">
        
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold text-accent mb-2" style={{ fontFamily: 'Amiri, serif' }}>My Reminders & Inspiration</h1>
          <p className="text-white/40 text-sm">Stay connected with your faith throughout the day.</p>
        </div>
        
        {/* Premium Prayer Times Section */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-10 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
              <FaRegClock />
            </div>
            <h2 className="text-xl font-bold text-white">Prayer Times (Makkah)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {prayers.map((prayer, idx) => (
              <div key={idx} className="bg-gradient-to-b from-white/10 to-transparent p-5 rounded-2xl border border-white/5 text-center hover:border-accent/30 transition-colors">
                <h3 className="font-bold text-white/80 text-sm uppercase tracking-wider mb-2">{prayer.name}</h3>
                <p className="text-accent font-extrabold text-2xl" style={{ fontFamily: 'Amiri, serif' }}>{prayer.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Inspiration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Hadith of the Day */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            <div className="h-40 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop" alt="Makkah" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a14] to-transparent"></div>
              <div className="absolute bottom-3 left-6 flex items-center gap-2">
                <FaBookOpen className="text-accent text-xl" />
                <h3 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>Hadith of the Day</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <span className="text-xs font-bold text-accent/80 mb-3 tracking-widest uppercase">Mishkat ul Masabih # 1957</span>
              <p className="text-white/80 text-sm leading-loose mb-4" style={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem' }}>
                رسول اللہ ﷺ نے فرمایا :’’ جنت کے آٹھ دروازے ہیں ، ان میں سے ایک دروازے کا نام ’’ الریان ‘‘ ہے ، اس میں سے صرف روزہ دار ہی داخل ہوں گے ۔‘‘
              </p>
            </div>
          </div>

          {/* Ayat of the Day */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            <div className="h-40 overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1565728744382-61accd4aa148?q=80&w=800&auto=format&fit=crop" alt="Quran" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a14] to-transparent"></div>
              <div className="absolute bottom-3 left-6 flex items-center gap-2">
                <FaBook className="text-accent text-xl" />
                <h3 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>Ayat of the Day</h3>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <span className="text-xs font-bold text-accent/80 mb-3 tracking-widest uppercase">Surah al-Baqarah [2:183]</span>
              <p className="text-white/80 text-sm leading-loose mb-3" style={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem' }}>
                یٰۤاَیُّہَا الَّذِیۡنَ اٰمَنُوۡا کُتِبَ عَلَیۡکُمُ الصِّیَامُ کَمَا کُتِبَ عَلَی الَّذِیۡنَ مِنۡ قَبۡلِکُمۡ لَعَلَّکُمۡ تَتَّقُوۡنَ ۔
              </p>
              <p className="text-white/50 text-xs leading-relaxed">
                اے ایمان والو ! تم پر روزے فرض کردیئے گئے ہیں ، جس طرح تم سے پہلے لوگوں پر فرض کیے گئے تھے ، تاکہ تمہارے اندر تقوی پیدا ہو
              </p>
            </div>
          </div>

        </div>

        {/* Islamic Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent text-3xl flex-shrink-0">
              <FaBook />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">The Holy Quran</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Read and understand the Holy Quran with reliable translations and Tafseer. Search for verses in a single tap.
              </p>
              <button className="bg-white/10 text-accent font-bold py-2 px-5 rounded-lg hover:bg-white/20 transition-colors text-sm border border-white/10">
                View More →
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-3xl flex-shrink-0">
              <FaBookOpen />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">Hadiths Collection</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Review a comprehensive collection of authentic Hadith in one place. Search for Hadith in a single tap.
              </p>
              <button className="bg-white/10 text-primary font-bold py-2 px-5 rounded-lg hover:bg-white/20 transition-colors text-sm border border-white/10">
                View More →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RemindersPage;
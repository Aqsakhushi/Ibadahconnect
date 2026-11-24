import { FaStar, FaQuoteLeft } from 'react-icons/fa';

// ---------- LOCAL SCHOLAR IMAGES (src/assets se auto-load) ----------
// Glob project root se chalta hai => component ki location se koi farq nahi padta.
// Filename kuch bhi ho — spaces ho, capital/small ho, .jpeg/.jpg/.png/.webp — sab match hoga.
const scholarImages = import.meta.glob('/src/assets/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP,avif,jfif}', {
  eager: true,
  import: 'default',
});

const norm = (s) => s.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z]/g, '');

const assetMap = {};
for (const [path, url] of Object.entries(scholarImages)) {
  const fileName = path.split('/').pop();
  assetMap[norm(fileName)] = url;
}

function findScholarImage(name) {
  const withoutTitle = name.replace(/^Sheikh\s+/i, '');
  const candidates = [name, withoutTitle, ...withoutTitle.split(' ')];
  for (const c of candidates) {
    const key = norm(c);
    if (key.length < 3) continue;
    if (assetMap[key]) return assetMap[key];
    // partial match — filename me naam ka hissa ho to bhi chalega
    const partial = Object.keys(assetMap).find((k) => k.includes(key) || key.includes(k));
    if (partial) return assetMap[partial];
  }
  return null;
}

const reviews = [
  {
    name: "Samiya Khan",
    role: "Family member of a recipient",
    text: "I had my uncle's Umrah performed through this service. The entire process was seamless, and I received confirmation promptly. The video proof gave me a sense of comfort and assurance. Highly recommended!"
  },
  {
    name: "Ahmed Farooq",
    role: "Son of a deceased pilgrim",
    text: "I entrusted the performance of Umrah for my late father. The team kept me informed throughout the process, and the video confirmation showed how it was done. JazakAllahu khayran."
  },
  {
    name: "Fatima Zahra",
    role: "Physically unable to travel",
    text: "Being unable to perform Umrah myself due to health issues, I opted for the Umrah Badal service. I'm so grateful for the team's professionalism and the detailed confirmation they provided."
  },
  {
    name: "Sana Malik",
    role: "Daughter of a deceased pilgrim",
    text: "I wanted to ensure my mother's Umrah was performed properly after her passing, and this service exceeded my expectations. I feel at peace knowing it was done correctly in Makkah."
  }
];

const scholars = [
  {
    name: 'Sheikh Bilal Ismail',
    country: 'South Africa',
    image: 'https://unavatar.io/youtube/@BilalIsmailVlogs',
    source: 'https://www.youtube.com/results?search_query=Bilal+Ismail+Hajj+Badal+Umrah+Badal',
  },
  {
    name: 'Sheikh Alaa Elsayed',
    country: 'Canada',
    image: 'https://unavatar.io/youtube/@AlaaElsayed',
    source: 'https://www.youtube.com/results?search_query=Alaa+Elsayed+Hajj+Badal+Umrah+Badal',
  },
  {
    name: 'Sheikh Yahya Ibrahim',
    country: 'Australia',
    image: 'https://unavatar.io/youtube/@YahyaIbrahim',
    source: 'https://www.youtube.com/results?search_query=Yahya+Ibrahim+Hajj+Badal+Umrah+Badal',
  },
  {
    name: 'Sheikh Navaid Aziz',
    country: 'Canada',
    image: 'https://images.squarespace-cdn.com/content/v1/5df147f51cf01d76cd6004e4/1577477015896-G59FTCWK9YIFP4GFY4NH/HiRes-00004.jpg',
    source: 'https://www.youtube.com/results?search_query=Navaid+Aziz+Hajj+Badal',
  },
  {
    name: 'Sheikh Abdul Nasir Jangda',
    country: 'USA',
    image: 'https://unavatar.io/youtube/AbdulNasirJangda',
    source: 'https://www.youtube.com/results?search_query=Abdul+Nasir+Jangda+Hajj+Badal+Umrah+Badal',
  },
];

const Testimonials = () => {
  return (
    <>
    <section className="bg-[#f4f8f6] py-20 overflow-hidden">
      <style>{`
        @keyframes scholarFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
        @keyframes scholarMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes scholarIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes goldPulse { 0%,100% { outline-color: rgba(212,175,55,.4) } 50% { outline-color: #d4af37 } }
        .scholar-track { animation: scholarMarquee 38s linear infinite; }
        .scholar-wrap:hover .scholar-track { animation-play-state: paused; }
        .scholar-float { animation: scholarFloat 4.5s ease-in-out infinite, scholarIn .8s ease backwards; }
        .scholar-float img {
          outline: 2px solid rgba(212,175,55,.4);
          outline-offset: 4px;
          animation: goldPulse 2.6s ease-in-out infinite;
          transition: transform .45s ease;
        }
        .scholar-float:hover img { transform: scale(1.12) rotate(2deg); }
        @media (prefers-reduced-motion: reduce) {
          .scholar-track, .scholar-float, .scholar-float img { animation: none; }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-6 text-center">
        <span className="inline-flex px-4 py-1.5 rounded-full bg-white border border-[#d4af37]/40 text-[#8a6d1a] text-[11px] font-extrabold tracking-[0.18em] uppercase">Scholar Guidance</span>
        <h2 className="mt-4 text-4xl font-extrabold text-[#14371e]" style={{ fontFamily: 'Amiri, serif' }}>Learn from Trusted Scholars</h2>
        <p className="text-[#68786f] max-w-2xl mx-auto mt-3">Watch public discussions and verify individual Hajj or Umrah Badal rulings with a qualified scholar familiar with your situation.</p>
      </div>
      <div className="scholar-wrap mt-10 overflow-hidden">
        <div className="scholar-track flex w-max px-6">
          {[...scholars, ...scholars].map((scholar, index) => {
            const img = findScholarImage(scholar.name) || scholar.image;
            return (
              <a
                key={`${scholar.name}-${index}`}
                href={scholar.source}
                target="_blank"
                rel="noopener noreferrer"
                className="scholar-float w-[220px] sm:w-[240px] shrink-0 mr-5 bg-white border border-[#e1eae5] rounded-3xl p-5 text-center hover:border-[#d4af37] hover:shadow-xl transition-all"
                style={{ animationDelay: `${(index % scholars.length) * 180}ms` }}
              >
                <img
                  src={img}
                  alt={scholar.name}
                  className="w-28 h-28 mx-auto rounded-full object-cover object-top border-4 border-white shadow-[0_8px_24px_rgba(15,61,20,.16)]"
                  onError={(event) => { event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name)}&background=14371e&color=e8c96a&size=256`; }}
                />
                <p className="mt-5 text-[10px] font-black tracking-[0.22em] text-[#9a7418] uppercase">Sheikh</p>
                <h3 className="mt-1 text-base font-extrabold text-[#14371e]">{scholar.name.replace('Sheikh ', '')}</h3>
                <p className="mt-1 text-xs font-bold text-[#68786f]">{scholar.country}</p>
                <span className="inline-flex mt-4 text-xs font-bold text-[#0d6b44]">Watch Guidance →</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>

    <section className="bg-[#0a0f0d] py-20 overflow-hidden">
      {/* marquee engine — Navbar ke navDrop jaisa hi inline style pattern */}
      <style>{`
        @keyframes marqueeMove { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .testi-track { animation: marqueeMove 45s linear infinite; will-change: transform; }
        .testi-wrap:hover .testi-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .testi-track { animation: none; } }
      `}</style>

      <div className="max-w-6xl mx-auto text-center px-6">
        <h2 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'Amiri, serif' }}>Hear from Our <span className="text-accent">Customers</span></h2>
        <p className="text-white/60 max-w-2xl mx-auto">Discover how our service has made it easier for people to perform Umrah Badal.</p>
      </div>

      {/* auto-scrolling slider — boxes aagay ki taraf slide hote rehte hain, hover par ruk jate hain */}
      <div className="testi-wrap relative mt-12">
        <div className="testi-track flex w-max items-stretch">
          {[...reviews, ...reviews].map((review, index) => (
            <div
              key={index}
              className="w-[300px] sm:w-[400px] shrink-0 mr-6 bg-dark/50 border border-primary/20 p-8 rounded-2xl relative text-left hover:border-accent/50 transition-colors duration-300"
            >
              <FaQuoteLeft className="text-accent/20 text-4xl absolute top-6 right-6" />
              <div className="flex text-accent gap-1 mb-4">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">{review.text}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent font-bold text-lg shrink-0">
                  {review.name[0]}
                </div>
                <div>
                  <h4 className="text-white font-bold">{review.name}</h4>
                  <p className="text-white/40 text-xs">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* dono taraf halka fade — cards kinaron par smoothly ghulte hain */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#0a0f0d] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#0a0f0d] to-transparent" />
      </div>
    </section>
    </>
  );
};

export default Testimonials;
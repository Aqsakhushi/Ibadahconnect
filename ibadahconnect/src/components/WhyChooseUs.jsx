import { FaCalendarCheck, FaQuran, FaBookOpen, FaHandHoldingHeart, FaBell, FaVideo, FaLaptop, FaShieldAlt, FaMoneyBillWave, FaBolt, FaCertificate } from 'react-icons/fa';

const features = [
  { icon: <FaBookOpen />, title: "Performed by Students", desc: "Umrah Badal is carried out by verified students of Islamic universities in Makkah, with sincerity and full understanding of the ritual." },
  { icon: <FaMoneyBillWave />, title: "Affordable Pricing", desc: "Because dedicated students perform the ibadah, we can offer lower prices without compromising on quality or responsibility." },
  { icon: <FaHandHoldingHeart />, title: "Spiritual Connection", desc: "For our performers this is a good deed as much as a duty, which adds sincerity and meaning to every ritual performed." },
  { icon: <FaVideo />, title: "Photo & Video Report", desc: "Once complete, you receive a full video/photo report from the pilgrimage sites as confirmation." },
  { icon: <FaBolt />, title: "Instant Auto-Assignment", desc: "As soon as you book, our system automatically assigns the best available verified performer — no waiting required." },
  { icon: <FaCertificate />, title: "Auto-Generated Certificate", desc: "A certificate of completion is generated automatically once your Ibadah is finished, ready to download." },
  { icon: <FaQuran />, title: "Shariah Compliance", desc: "Every Umrah rite is conducted in full accordance with Shariah." },
  { icon: <FaCalendarCheck />, title: "Completed in 3–4 Days", desc: "Most Umrah Badal requests are completed within 3 to 4 days of assignment." },
  { icon: <FaShieldAlt />, title: "Trusted Service", desc: "We’ve earned the trust of Muslims worldwide for our reliability and sincerity." }
];

const WhyChooseUs = () => {
  return (
    <section className="bg-dark py-20 px-6 border-b border-primary/20">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'Amiri, serif' }}>Why Choose <span className="text-accent">IbadahConnect?</span></h2>
        <p className="text-white/60 mb-12 max-w-2xl mx-auto">Over the years, our devoted Makkah-based team has been helping Muslims around the world fulfill this responsibility الحمد لله.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-primary/5 border border-primary/20 p-6 rounded-2xl hover:border-accent transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] group text-center">
              <div className="text-3xl text-accent mb-4 inline-block group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
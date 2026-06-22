import { FaCalendarCheck, FaQuran, FaBookOpen, FaHandHoldingHeart, FaBell, FaVideo, FaLaptop, FaShieldAlt } from 'react-icons/fa';

const features = [
  { icon: <FaCalendarCheck />, title: "Year-Round Service", desc: "Available throughout the year, no matter the season or circumstance." },
  { icon: <FaQuran />, title: "Shariah Compliance", desc: "Every Umrah rite is conducted in full accordance with Shariah." },
  { icon: <FaBookOpen />, title: "Performed by Team", desc: "Umrah Badal is carried out by dedicated students of knowledge in Makkah." },
  { icon: <FaHandHoldingHeart />, title: "Dedicated Intention", desc: "Performed with a clear and sincere intention on behalf of the specified individual." },
  { icon: <FaBell />, title: "Regular Updates", desc: "Receive timely notifications and confirmations to keep you informed." },
  { icon: <FaVideo />, title: "Video Confirmation", desc: "We provide video documentation of the Umrah being performed." },
  { icon: <FaLaptop />, title: "Convenient Online Booking", desc: "Easily book your Umrah Badal through our secure online platform." },
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
import { Link } from 'react-router-dom';

const ServicesSection = () => {
  const services = [
    { 
      video: "/videos/umrah.mp4", 
      title: "Umrah Badal", 
      desc: "Performed by verified individuals who have already completed their own Umrah, with step-by-step video proof.", 
      btn: "View Packages →" 
    },
    { 
      video: "/videos/hajj.mp4", 
      title: "Hajj Badal", 
      desc: "Ensure your deceased family members' Hajj is performed with the utmost devotion and strict Islamic guidelines.", 
      btn: "View Packages →" 
    },
    { 
      video: "/videos/sadaqah.mp4", 
      title: "Sadaqah & Donations", 
      desc: "Chair donations in Haram, Roza Kushai, Zamzam water delivery, and Qurbani services on behalf of the deceased.", 
      btn: "Explore Services →" 
    }
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-4xl font-extrabold text-primary mb-3" style={{ fontFamily: 'Amiri, serif' }}>Our Services</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">Fulfilling the spiritual obligations for your loved ones with complete authenticity and Shariah compliance.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((svc, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
            
            {/* Video Display */}
            <div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden bg-gray-100">
              <video 
                className="absolute inset-0 w-full h-full object-cover"
                src={svc.video}
                autoPlay 
                loop 
                muted 
                playsInline
              ></video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Amiri, serif' }}>{svc.title}</h3>
            <p className="text-gray-500 text-sm mb-8 flex-1 leading-relaxed">{svc.desc}</p>
            
            <Link 
              to="/dashboard" 
              className="mt-auto inline-block bg-gray-50 text-primary font-bold py-3 px-6 rounded-xl hover:bg-accent hover:text-white transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              {svc.btn}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;
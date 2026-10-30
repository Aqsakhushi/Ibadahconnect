import { Link } from 'react-router-dom';

const HeroSection = ({ openAuthModal }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  const handleBookClick = () => {
    if (!user) {
      openAuthModal();
    } else {
      window.location.href = '/dashboard';
    }
  };  
  
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
      
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/tawaf.mp4"
        autoPlay
        loop
        muted
        playsInline
      ></video>

      {/* Light Overlay (White theme ke liye thora light overlay) */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: 'Amiri, serif' }}>
          Book Your <span className="text-accent">Umrah Badal</span> in Makkah
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
          Perform Umrah on behalf of your deceased loved ones through our verified and Shariah-compliant performers. With live video proof and milestone tracking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={handleBookClick}
            className="bg-accent text-white font-bold px-8 py-4 rounded-full hover:bg-accent/90 transition-all duration-300 shadow-xl text-lg"
          >
            Book Umrah Badal
          </button>
          {/* YEH BUTTON AB KAAM KAREGA */}
          <Link 
            to="/dashboard" 
            className="bg-white/10 backdrop-blur-md border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/20 transition-all duration-300 text-lg flex items-center justify-center"
          >
            Explore Services
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
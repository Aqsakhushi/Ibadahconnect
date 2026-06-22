const FeaturesSection = () => {
  return (
    <div className="bg-dark py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-white font-amiri mb-4">
          Why Choose <span className="text-accent">IbadahConnect?</span>
        </h2>
        <p className="text-white/60 mb-12 max-w-2xl mx-auto">
          We ensure your proxy Umrah and Hajj are performed with the utmost sincerity, strictly following Islamic guidelines.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl hover:border-accent transition-all duration-300">
            <div className="text-accent text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-3">Shariah Compliant</h3>
            <p className="text-white/60 text-sm">All rituals are performed strictly according to Quran and Sunnah by verified scholars.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl hover:border-accent transition-all duration-300">
            <div className="text-accent text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-white mb-3">Verified Performers</h3>
            <p className="text-white/60 text-sm">Our team consists of verified individuals who have already performed Umrah/Hajj themselves.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl hover:border-accent transition-all duration-300">
            <div className="text-accent text-4xl mb-4">📹</div>
            <h3 className="text-xl font-bold text-white mb-3">Video Proof & Tracking</h3>
            <p className="text-white/60 text-sm">Receive live milestone updates and video evidence of every step performed on behalf of your loved ones.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
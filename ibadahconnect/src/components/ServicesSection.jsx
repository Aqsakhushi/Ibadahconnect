const ServicesSection = () => {
  return (
    <section className="bg-dark py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'Amiri, serif' }}>Our <span className="text-accent">Services</span></h2>
        <p className="text-white/60 mb-12 max-w-2xl mx-auto">Fulfilling the spiritual obligations for your loved ones with complete authenticity and Shariah compliance.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl hover:border-accent transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <div className="text-5xl mb-4">🕋</div>
            <h3 className="text-2xl font-bold text-white mb-3">Umrah Badal</h3>
            <p className="text-white/60 text-sm mb-6">Performed by verified individuals who have already completed their own Umrah, with step-by-step video proof.</p>
            <button className="text-accent font-bold hover:text-white transition-colors text-sm">View Packages →</button>
          </div>

          {/* Card 2 */}
          <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl hover:border-accent transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <div className="text-5xl mb-4">🕌</div>
            <h3 className="text-2xl font-bold text-white mb-3">Hajj Badal</h3>
            <p className="text-white/60 text-sm mb-6">Ensure your deceased family members' Hajj is performed with the utmost devotion and strict Islamic guidelines.</p>
            <button className="text-accent font-bold hover:text-white transition-colors text-sm">View Packages →</button>
          </div>

          {/* Card 3 */}
          <div className="bg-primary/10 border border-primary/30 p-8 rounded-2xl hover:border-accent transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <div className="text-5xl mb-4">🤲</div>
            <h3 className="text-2xl font-bold text-white mb-3">Sadaqah & Donations</h3>
            <p className="text-white/60 text-sm mb-6">Chair donations in Haram, Roza Kushai, Zamzam water delivery, and Qurbani services on behalf of the deceased.</p>
            <button className="text-accent font-bold hover:text-white transition-colors text-sm">Explore Services →</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
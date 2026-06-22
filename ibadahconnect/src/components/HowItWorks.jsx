const HowItWorks = () => {
  return (
    <section className="bg-[#0a0f0d] py-20 px-6 border-y border-primary/20">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-16" style={{ fontFamily: 'Amiri, serif' }}>How It <span className="text-accent">Works</span></h2>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative">
          
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center w-full md:w-1/3">
            <div className="w-14 h-14 rounded-full bg-dark border-2 border-accent text-accent font-bold text-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">1</div>
            <h3 className="text-xl font-bold text-white mb-2">Book & Pay</h3>
            <p className="text-white/50 text-sm">Select a package, provide the deceased's details, and make a secure payment held in escrow.</p>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center w-full md:w-1/3">
            <div className="w-14 h-14 rounded-full bg-dark border-2 border-accent text-accent font-bold text-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">2</div>
            <h3 className="text-xl font-bold text-white mb-2">Performer Assigned</h3>
            <p className="text-white/50 text-sm">A verified performer is assigned who has already performed Umrah/Hajj themselves with proper proof.</p>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center w-full md:w-1/3">
            <div className="w-14 h-14 rounded-full bg-dark border-2 border-accent text-accent font-bold text-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(212,175,55,0.3)]">3</div>
            <h3 className="text-xl font-bold text-white mb-2">Track Milestones</h3>
            <p className="text-white/50 text-sm">Receive live updates and photo/video proof of every step (Ehram, Tawaf, Sa'i, Dua).</p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
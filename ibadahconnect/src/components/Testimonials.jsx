import { FaStar, FaQuoteLeft } from 'react-icons/fa';

const reviews = [
  {
    name: "Samiya Khan",
    role: "Family member of a recipient",
    text: "I had my uncle’s Umrah performed through this service. The entire process was seamless, and I received confirmation promptly. The video proof gave me a sense of comfort and assurance. Highly recommended!"
  },
  {
    name: "Ahmed Farooq",
    role: "Son of a deceased pilgrim",
    text: "I entrusted the performance of Umrah for my late father. The team kept me informed throughout the process, and the video confirmation showed how it was done. JazakAllahu khayran."
  },
  {
    name: "Fatima Zahra",
    role: "Physically unable to travel",
    text: "Being unable to perform Umrah myself due to health issues, I opted for the Umrah Badal service. I’m so grateful for the team’s professionalism and the detailed confirmation they provided."
  },
  {
    name: "Sana Malik",
    role: "Daughter of a deceased pilgrim",
    text: "I wanted to ensure my mother’s Umrah was performed properly after her passing, and this service exceeded my expectations. I feel at peace knowing it was done correctly in Makkah."
  }
];

const Testimonials = () => {
  return (
    <section className="bg-[#0a0f0d] py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'Amiri, serif' }}>Hear from Our <span className="text-accent">Customers</span></h2>
        <p className="text-white/60 mb-12 max-w-2xl mx-auto">Discover how our service has made it easier for people to perform Umrah Badal.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-dark/50 border border-primary/20 p-8 rounded-2xl relative text-left hover:border-accent/50 transition-all duration-300">
              <FaQuoteLeft className="text-accent/20 text-4xl absolute top-6 right-6" />
              <div className="flex text-accent gap-1 mb-4">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">{review.text}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent font-bold text-lg">
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
      </div>
    </section>
  );
};

export default Testimonials;
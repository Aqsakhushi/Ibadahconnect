import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import API from '../api';

const ServiceDetailPage = ({ openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [qty, setQty] = useState(1);
  const [service, setService] = useState(null);

  // Donations ka static data
  const servicesData = {
    'hajj-badal': { name: "Hajj Badal", price: 300000, img: "/images/hajj.jpg", btn: "Book Hajj Badal", isCart: false, desc: "Fulfill the ultimate pillar of Islam on behalf of your deceased loved ones.", faqs: [{ q: "What is Hajj Badal?", a: "Performing Hajj on behalf of someone who is unable to do so." }] },
    'wheelchair': { name: "Wheelchair Donation", price: 25000, img: "/images/wheelchair.jpg", btn: "Add to Cart", isCart: true, desc: "Donate a wheelchair to Masjid al-Haram.", faqs: [{ q: "How does it work?", a: "We purchase a wheelchair on your behalf." }] },
    'roza-kushai': { name: "Roza Kushai (Iftar)", price: 5000, img: "/images/roza.jpg", btn: "Add to Cart", isCart: true, desc: "Arrange Iftar for a fasting person.", faqs: [{ q: "What is included?", a: "Dates, water, and a basic meal." }] },
    'tasbeeh': { name: "Tasbeeh Distribution", price: 400, img: "/images/tasbeeh.jpg", btn: "Add to Cart", isCart: true, desc: "Distribute prayer beads to worshippers in Haram.", faqs: [{ q: "How many?", a: "10 pieces of high-quality prayer beads." }] },
    'zamzam': { name: "Ab-e-Zamzam Delivery", price: 8000, img: "/images/zamzam.jpg", btn: "Add to Cart", isCart: true, desc: "Arrange pure Zamzam water to be distributed.", faqs: [{ q: "Quantity?", a: "5 Liters of pure Zamzam water." }] },
    'iftar-makkah': { name: "Iftar in Makkah", price: 40000, img: "/images/orphans.jpg", btn: "Add to Cart", isCart: true, desc: "Sponsor Iftar dinner for fasting people in Makkah.", faqs: [{ q: "What is included?", a: "A complete Iftar meal for fasting individuals." }] }
  };

  useEffect(() => {
    // Agar ID donations mein hai toh wo show karo, warna DB se fetch karo
    if (servicesData[id]) {
      setService(servicesData[id]);
    } else {
      const fetchPackage = async () => {
        try {
          const res = await API.get('/packages/all');
          const found = res.data.find(p => p._id === id);
          if (found) {
            setService({
              name: found.title,
              price: found.price,
              img: found.image,
              btn: "Book Umrah Badal",
              isCart: false,
              desc: found.desc,
              faqs: [{ q: "What is Umrah Badal?", a: "Umrah Badal is the act of performing Umrah on behalf of someone who is unable to do so themselves." }]
            });
          } else {
            setService(servicesData['iftar-makkah']); // Fallback
          }
        } catch (err) {
          setService(servicesData['iftar-makkah']); // Fallback
        }
      };
      fetchPackage();
    }
  }, [id]);

  const handleBookClick = () => {
    if (!user) {
      openAuthModal();
    } else {
      navigate(`/checkout/${id}`);
    }
  };

  if (!service) return <div className="pt-20 text-center text-gray-500">Loading...</div>;

  const totalPrice = service.price * qty;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="pt-10 pb-16 px-6 max-w-6xl mx-auto">
        
        <div className="text-sm text-gray-500 mb-8">
          <Link to="/dashboard" className="hover:text-primary">Dashboard</Link> <span className="mx-2">/</span> <span className="text-gray-900">{service.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16">
          
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl bg-gray-100">
            <img src={service.img} alt={service.name} className="w-full h-full object-cover" />
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-md border border-gray-100">
            <h1 className="text-4xl font-extrabold text-primary mb-4" style={{ fontFamily: 'Amiri, serif' }}>{service.name}</h1>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-extrabold text-gray-900">PKR {service.price.toLocaleString()}</span>
              <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full">In Stock</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-accent"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
              <span className="text-sm text-gray-500">(3 customer reviews)</span>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-8 border-b border-gray-100 pb-6">{service.desc}</p>

            {service.isCart && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                <div className="flex items-center gap-4 w-full">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 text-2xl font-bold text-gray-600 hover:bg-gray-100">-</button>
                  <input type="number" value={qty} readOnly className="w-20 h-12 text-center text-xl font-bold rounded-xl bg-gray-50 border border-gray-200" />
                  <button onClick={() => setQty(qty + 1)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 text-2xl font-bold text-gray-600 hover:bg-gray-100">+</button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-gray-500">Total Amount:</span>
              <span className="text-2xl font-extrabold text-primary">PKR {totalPrice.toLocaleString()}</span>
            </div>

            <button onClick={handleBookClick} className={`w-full font-bold py-4 rounded-xl transition-all duration-300 text-lg shadow-md ${service.isCart ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-accent text-white hover:bg-accent/90'}`}>
              {service.btn}
            </button>
          </div>
        </div>

        {/* --- FAZEELAT (Virtues) SECTION --- */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-md border border-gray-100 mb-16 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg">
              <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop" alt="Makkah" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-primary mb-4" style={{ fontFamily: 'Amiri, serif' }}>The Virtues (Fazeelat)</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Performing acts of worship on behalf of the deceased carries immense rewards. It is a means of continuous charity (Sadaqah Jariyah) for both the living and the dead.
              </p>
              <div className="bg-gray-50 border-l-4 border-accent p-4 rounded-r-xl">
                <p className="text-sm text-gray-700 italic">
                  "When a man dies, his acts come to an end, except three: recurring charity, or knowledge (by which people) benefit, or a pious child, who prays for him (for the deceased)."
                </p>
                <p className="text-xs text-gray-400 mt-2 font-bold">— Sahih Muslim 1631</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description & FAQs */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-md border border-gray-100 mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4" style={{ fontFamily: 'Amiri, serif' }}>Description & FAQs</h2>
          <div className="space-y-8">
            {service.faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-6">
                <h3 className="text-xl font-bold text-primary mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
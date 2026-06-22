import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import API from '../api';

const Dashboard = ({ openAuthModal }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlist, setWishlist] = useState(JSON.parse(localStorage.getItem('wishlist')) || []);
  const [packages, setPackages] = useState([]); // DB se aayenge

  const handleBookClick = () => {
    if (!user) { openAuthModal(); } else { window.location.href = '/checkout/umrah-1'; }
  };

  const toggleWishlist = (id) => {
    let updatedWishlist = wishlist.includes(id) ? wishlist.filter(item => item !== id) : [...wishlist, id];
    setWishlist(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  const inspirations = [
    { title: "Hadith of the Day", text: "رسول اللہ ﷺ نے فرمایا :’’ جنت کے آٹھ دروازے ہیں ، ان میں سے ایک دروازے کا نام ’’ الریان ‘‘ ہے ، اس میں سے صرف روزہ دار ہی داخل ہوں گے ۔‘‘", img: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop" },
    { title: "Ayat of the Day", text: "اے ایمان والو ! تم پر روزے فرض کردیئے گئے ہیں ، جس طرح تم سے پہلے لوگوں پر فرض کیے گئے تھے ، تاکہ تمہارے اندر تقوی پیدا ہو", img: "https://images.unsplash.com/photo-1565728744382-61accd4aa148?q=80&w=800&auto=format&fit=crop" }
  ];

  useEffect(() => {
    const fetchPackages = async () => {
      try { const res = await API.get('/packages/all'); setPackages(res.data); } catch (err) { console.log("Err"); }
    };
    fetchPackages();
    const timer = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % inspirations.length); }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const otherServices = [
    { id: "hajj-badal", name: "Hajj Badal", price: "PKR 300,000", desc: "Fulfill the ultimate pillar of Islam.", img: "/images/hajj.jpg", btn: "View Details" },
    { id: "wheelchair", name: "Wheelchair Donation", price: "PKR 25,000", desc: "Donate a wheelchair to Masjid al-Haram.", img: "/images/wheelchair.jpg", btn: "Add to Cart" },
    { id: "roza-kushai", name: "Roza Kushai (Iftar)", price: "PKR 5,000", desc: "Arrange Iftar for a fasting person.", img: "/images/roza.jpg", btn: "Add to Cart" },
    { id: "orphans", name: "Iftar for Orphan Girls", price: "PKR 40,000", desc: "Sponsor Iftar dinner for orphan girls.", img: "/images/orphans.jpg", btn: "Add to Cart" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-outfit">
      <div className="flex">
        
        <aside className="hidden md:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-gray-100 p-4 z-10 flex-shrink-0">
          <nav className="flex-1 space-y-1 py-4">
            <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm shadow-md"><span>📦</span> Services</Link>
            <Link to="/cart" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors font-semibold text-sm"><span>🛒</span> View Cart</Link>
            <Link to="/wishlist" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors font-semibold text-sm"><span>❤️</span> Wishlist</Link>
            <Link to="/reminders" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors font-semibold text-sm"><span>⏰</span> My Reminders</Link>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          
          <header className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 flex justify-between items-center sticky top-14 z-10">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{getGreeting()}, {user?.firstName} {user?.lastName}! 👋</h2>
              <p className="text-gray-400 text-xs">Manage your bookings and services here.</p>
            </div>
            <button onClick={handleBookClick} className="hidden md:flex bg-primary text-white font-bold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all text-sm items-center gap-2">+ New Booking</button>
          </header>

          <div className="p-6 md:p-10">
            
            <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl aspect-[21/9]">
              <video className="absolute inset-0 w-full h-full object-cover" src="/videos/banner.mp4" autoPlay loop muted playsInline></video>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent flex items-center">
                <div className="p-8 md:p-14 max-w-xl">
                  <span className="inline-block bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 tracking-widest">LIMITED TIME OFFER</span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight" style={{ fontFamily: 'Amiri, serif' }}>Fulfill the Sacred Duty</h3>
                  <p className="text-white/80 text-sm mb-6 max-w-md">Perform Umrah on behalf of your deceased loved ones with complete transparency.</p>
                  <button onClick={handleBookClick} className="bg-accent text-white font-bold px-6 py-2.5 rounded-full hover:bg-white hover:text-primary transition-all duration-300 text-sm shadow-lg flex items-center gap-2">Book Now <span>→</span></button>
                </div>
              </div>
            </div>

            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Umrah Badal Packages</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {packages.map(pkg => (
                <div key={pkg._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white leading-tight" style={{ fontFamily: 'Amiri, serif' }}>{pkg.title}</h4>
                    <button onClick={() => toggleWishlist(pkg._id)} className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors">
                      {wishlist.includes(pkg._id) ? <FaHeart className="text-red-500" /> : <FaRegHeart className="text-gray-700" />}
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xl font-extrabold text-primary mb-2">PKR {pkg.price.toLocaleString()}</span>
                    <p className="text-gray-500 text-sm mb-5 flex-1">{pkg.desc}</p>
                    <Link to={`/service/${pkg._id}`} className="w-full bg-gray-50 text-primary font-bold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 text-sm flex items-center justify-center gap-1">View Details <span>→</span></Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'Amiri, serif' }}>Other Services & Donations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {otherServices.map(svc => (
                <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <img src={svc.img} alt={svc.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>{svc.name}</h4>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xl font-extrabold text-primary mb-2">{svc.price}</span>
                    <p className="text-gray-500 text-sm mb-5 flex-1">{svc.desc}</p>
                    <Link to={`/service/${svc.id}`} className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 transition-all duration-300 text-sm text-center flex items-center justify-center gap-1">{svc.btn} <span>🛒</span></Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-12">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: 'Amiri, serif' }}>Daily Inspiration</h3>
              <div className="relative h-64 md:h-72 rounded-3xl overflow-hidden shadow-xl">
                {inspirations.map((ins, idx) => (
                  <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100' : 'opacity-0'}`}>
                    <img src={ins.img} alt={ins.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center">
                      <div className="p-8 md:p-12 max-w-lg">
                        <span className="inline-block bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-widest">{ins.title}</span>
                        <p className="text-white text-sm md:text-base font-medium leading-relaxed" style={{ fontFamily: 'Amiri, serif' }}>{ins.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
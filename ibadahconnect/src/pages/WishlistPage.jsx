import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);

  // All services data (Taake IDs se details nikal saken)
  const allServices = [
    { id: "umrah-1", name: "Economy Badal", price: "PKR 50,000", desc: "Essential Umrah Badal with photo updates.", img: "/images/noor.jpg" },
    { id: "umrah-2", name: "Noor Umrah Package", price: "PKR 60,000", desc: "Standard Umrah Badal with regular photo updates.", img: "/images/noor.jpg" },
    { id: "umrah-3", name: "Du'a Package", price: "PKR 70,000", desc: "Focused on specific prayers at holy sites.", img: "/images/dua.jpg" },
    { id: "umrah-4", name: "Barakah Premium", price: "PKR 80,000", desc: "Enhanced service with video documentation.", img: "/images/barakah.jpg" },
    { id: "umrah-5", name: "Video Proof Package", price: "PKR 90,000", desc: "Complete video evidence of all rituals.", img: "/images/barakah.jpg" },
    { id: "umrah-6", name: "Express Umrah", price: "PKR 100,000", desc: "Priority booking and fastest execution.", img: "/images/noor.jpg" },
    { id: "umrah-7", name: "Standard Plus", price: "PKR 110,000", desc: "Includes extra duas and HD photos.", img: "/images/dua.jpg" },
    { id: "umrah-8", name: "Jaryah Premium", price: "PKR 120,000", desc: "Includes Sadaqah and continuous updates.", img: "/images/jaryah.jpg" },
    { id: "umrah-9", name: "Family Badal", price: "PKR 150,000", desc: "Perform for multiple family members.", img: "/images/jaryah.jpg" },
    { id: "umrah-10", name: "Ramadan Special", price: "PKR 200,000", desc: "Perform Umrah in the blessed month of Ramadan.", img: "/images/barakah.jpg" },
    { id: "umrah-11", name: "VIP Badal Package", price: "PKR 250,000", desc: "Ultimate package with VIP performer & live stream.", img: "/images/jaryah.jpg" },
    { id: "umrah-12", name: "Royal Jaryah", price: "PKR 300,000", desc: "The ultimate package including all services.", img: "/images/noor.jpg" },
    { id: "hajj-badal", name: "Hajj Badal", price: "PKR 300,000", desc: "Fulfill the ultimate pillar of Islam.", img: "/images/hajj.jpg" },
    { id: "wheelchair", name: "Wheelchair Donation", price: "PKR 25,000", desc: "Donate a wheelchair to Masjid al-Haram.", img: "/images/wheelchair.jpg" },
    { id: "roza-kushai", name: "Roza Kushai (Iftar)", price: "PKR 5,000", desc: "Arrange Iftar for a fasting person.", img: "/images/roza.jpg" },
    { id: "tasbeeh", name: "Tasbeeh Distribution", price: "PKR 4,000", desc: "Distribute prayer beads in Haram.", img: "/images/tasbeeh.jpg" },
    { id: "zamzam", name: "Ab-e-Zamzam Delivery", price: "PKR 8,000", desc: "Arrange pure Zamzam water.", img: "/images/zamzam.jpg" },
    { id: "orphans", name: "Iftar for Orphan Girls", price: "PKR 40,000", desc: "Sponsor Iftar dinner for orphan girls.", img: "/images/orphans.jpg" }
  ];

  // Jab page load ho toh localStorage se IDs nikal kar items fetch kare
  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('wishlist')) || [];
    const items = allServices.filter(svc => savedIds.includes(svc.id));
    setWishlistItems(items);
  }, []);

  // Item ko Wishlist se remove karne ka function
  const removeItem = (id) => {
    const savedIds = JSON.parse(localStorage.getItem('wishlist')) || [];
    const updatedIds = savedIds.filter(savedId => savedId !== id);
    localStorage.setItem('wishlist', JSON.stringify(updatedIds));
    
    const items = allServices.filter(svc => updatedIds.includes(svc.id));
    setWishlistItems(items);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 md:p-12">
      <h1 className="text-3xl font-extrabold text-primary mb-8" style={{ fontFamily: 'Amiri, serif' }}>My Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-6">❤️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8">Save your favorite services here for later.</p>
          <Link to="/dashboard" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
            Explore Services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map(svc => (
            <div key={svc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group">
              <div className="relative aspect-video overflow-hidden bg-gray-100">
                <img src={svc.img} alt={svc.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>{svc.name}</h4>
                {/* Remove Button (Trash Icon) */}
                <button onClick={() => removeItem(svc.id)} className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors">
                  <FaTrash />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xl font-extrabold text-primary mb-2">{svc.price}</span>
                <p className="text-gray-500 text-sm mb-5 flex-1">{svc.desc}</p>
                <Link to={`/service/${svc.id}`} className="w-full bg-gray-50 text-primary font-bold py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 text-sm text-center">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
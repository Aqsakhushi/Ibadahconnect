import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('wishlist')) || [];
    setWishlistItems(items);
  }, []);

  const removeItem = (id) => {
    let updatedWishlist = wishlistItems.filter(item => item.id !== id);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    setWishlistItems(updatedWishlist);
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
                <img src={svc.img || '/images/noor.jpg'} alt={svc.name || 'Service'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <h4 className="absolute bottom-3 left-4 text-lg font-extrabold text-white" style={{ fontFamily: 'Amiri, serif' }}>{svc.name || 'Unknown'}</h4>
                <button onClick={() => removeItem(svc.id)} className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors">
                  <FaTrash />
                </button>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xl font-extrabold text-primary mb-2">PKR {(svc.price || 0).toLocaleString()}</span>
                <p className="text-gray-500 text-sm mb-5 flex-1">{svc.desc || 'No description available.'}</p>
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
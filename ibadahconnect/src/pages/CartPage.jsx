import { Link } from 'react-router-dom';
import { useState } from 'react';

const CartPage = () => {
  const [cartItems, setCartItems] = useState(JSON.parse(localStorage.getItem('cart')) || []);

  const handleRemove = (id) => {
    let updatedCart = cartItems.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartItems(updatedCart);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12">
      <h1 className="text-3xl font-extrabold text-primary mb-8" style={{ fontFamily: 'Amiri, serif' }}>Your Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Add services to your cart to proceed with checkout.</p>
          <Link to="/dashboard" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Cart Items ({cartItems.length})</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {cartItems.map((item, index) => (
              <div key={index} className="p-6 flex items-center gap-6">
                <img src={item.img} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg mb-2">PKR {item.price.toLocaleString()}</p>
                  <button onClick={() => handleRemove(item.id)} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gray-50 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-extrabold text-primary">PKR {totalAmount.toLocaleString()}</p>
            </div>
            <Link to="/dashboard" className="bg-accent text-white font-bold px-8 py-3 rounded-full hover:bg-accent/90 transition-colors">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
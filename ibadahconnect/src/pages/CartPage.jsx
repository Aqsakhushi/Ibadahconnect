import { Link } from 'react-router-dom';

const CartPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12">
      <h1 className="text-3xl font-extrabold text-primary mb-8" style={{ fontFamily: 'Amiri, serif' }}>Your Cart</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add services to your cart to proceed with checkout.</p>
        <Link to="/dashboard" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
          Browse Services
        </Link>
      </div>
    </div>
  );
};

export default CartPage;
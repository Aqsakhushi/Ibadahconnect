import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import WhyChooseUs from './components/WhyChooseUs';
import ServicesSection from './components/ServicesSection';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import RemindersPage from './pages/RemindersPage';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-white font-outfit flex flex-col">
        
        <Navbar openModal={() => setIsAuthModalOpen(true)} />
        
        {/* pt-14 use kiya hai taake navbar ke sath bilkul chipak jaye */}
        <div className="pt-14 flex-grow">
          <Routes>
            <Route path="/" element={
              <>
                <HeroSection openAuthModal={() => setIsAuthModalOpen(true)} />
                <WhyChooseUs />
                <ServicesSection />
                <HowItWorks />
                <Testimonials />
              </>
            } />
            <Route path="/service/:id" element={<ServiceDetailPage openAuthModal={() => setIsAuthModalOpen(true)} />} />
            <Route path="/checkout/:id" element={<CheckoutPage openAuthModal={() => setIsAuthModalOpen(true)} />} />
            <Route path="/dashboard" element={<Dashboard openAuthModal={() => setIsAuthModalOpen(true)} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/personal-info" element={<ProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>

        <Footer />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        
      </div>
    </BrowserRouter>
  );
}

export default App;
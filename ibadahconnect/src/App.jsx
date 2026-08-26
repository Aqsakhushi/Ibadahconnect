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
import HowItWorksPage from './pages/HowItWorksPage';
import FAQsPage from './pages/FAQsPage';
import { Toaster } from 'react-hot-toast';
import PerformerOnboarding from './pages/PerformerOnboarding';

// Admin Pages
import AdminDashboard, { AdminOverview } from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPackages from './pages/AdminPackages';
import AdminBookings from './pages/AdminBookings';
import AdminPerformers from './pages/AdminPerformers';
import AdminHistory from './pages/AdminHistory';

// Sponsor aur Public Pages
import Dashboard from './pages/Dashboard';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import RemindersPage from './pages/RemindersPage';
import PaymentResponse from './pages/PaymentResponse';

// Performer Page
import PerformerDashboard from './pages/PerformerDashboard';

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { zIndex: 9999, background: '#1B5E20', color: '#fff', fontWeight: '600', borderRadius: '12px', padding: '12px 20px' } }} />
      
      <Routes>
        
        {/* 1. Admin Routes (Isolated - No Navbar/Footer) */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="performers" element={<AdminPerformers />} />
          <Route path="history" element={<AdminHistory />} />
        </Route>

        {/* 2. Performer Routes (Isolated - No Navbar/Footer) */}
        <Route path="/performer-onboarding" element={<PerformerOnboarding />} />
        <Route path="/performer-dashboard" element={<PerformerDashboard />} />
        
        {/* 3. Public & Sponsor Routes (With Navbar/Footer) */}
        <Route path="/*" element={
          <div className="min-h-screen bg-white font-outfit flex flex-col">
            <Navbar openModal={() => setIsAuthModalOpen(true)} />
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
                <Route path="/payment-response" element={<PaymentResponse />} />
                <Route path="/dashboard" element={<Dashboard openAuthModal={() => setIsAuthModalOpen(true)} />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/personal-info" element={<ProfilePage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/reminders" element={<RemindersPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/faqs" element={<FAQsPage />} />
              </Routes>
            </div>
            <Footer />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
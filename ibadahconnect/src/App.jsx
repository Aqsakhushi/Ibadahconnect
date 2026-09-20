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

// Full-page Auth (new)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
// Cart Provider
import { CartProvider } from './context/CartContext';

// Admin Pages
import AdminDashboard, { AdminOverview } from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPackages from './pages/AdminPackages';
import AdminBookings from './pages/AdminBookings';
import AdminPerformers from './pages/AdminPerformers';
import AdminHistory from './pages/AdminHistory';
import AdminRules from './pages/AdminRules';

// Public & Sponsor Pages
import Dashboard from './pages/Dashboard';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import RemindersPage from './pages/RemindersPage';
import PaymentResponse from './pages/PaymentResponse';
import TrackOrder from './pages/TrackOrder';
import PerformerProfile from './pages/PerformerProfile';

// Performer Pages
import PerformerDashboard from './pages/PerformerDashboard';
import PerformerRulesPage from './pages/PerformerRulesPage';
import SelfFamilyPortal from './pages/SelfFamilyPortal';
import CnicVerifyPage from './pages/CnicVerifyPage';
import AdminCnicPanel from './pages/AdminCnicPanel';
function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop />

        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              zIndex: 9999,
              background: '#1B5E20',
              color: '#fff',
              fontWeight: '600',
              borderRadius: '12px',
              padding: '12px 20px',
            },
          }}
        />

        <Routes>

          {/* =========================
              FULL-PAGE AUTH (new)
          ========================= */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
<Route path="/verify-email" element={<VerifyEmailPage />} />
<Route path="/cnic-verify" element={<CnicVerifyPage />} />
<Route path="/admin/cnic" element={<AdminCnicPanel />} />
          {/* =========================
              ADMIN
          ========================= */}
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="performers" element={<AdminPerformers />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="rules" element={<AdminRules />} />
          </Route>

          {/* =========================
              PERFORMER
          ========================= */}
          <Route
            path="/performer-onboarding"
            element={<PerformerOnboarding />}
          />

          <Route
            path="/performer-dashboard"
            element={<PerformerDashboard />}
          />

          <Route
            path="/performer-rules"
            element={<PerformerRulesPage />}
          />

          <Route
            path="/self-family-portal"
            element={<SelfFamilyPortal />}
          />

          {/* =========================
              PUBLIC / SPONSOR
          ========================= */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-white font-outfit flex flex-col">

                <Navbar
                  openModal={goToLogin}
                />
<div className="pt-16 flex-grow">
                  <Routes>

                    {/* HOME */}
                    <Route
                      path="/"
                      element={
                        <>
                          <HeroSection
                            openAuthModal={goToLogin}
                          />
                          <WhyChooseUs />
                          <ServicesSection />
                          <HowItWorks />
                          <Testimonials />
                        </>
                      }
                    />

                    {/* SERVICE DETAILS */}
                    <Route
                      path="/service/:id"
                      element={
                        <ServiceDetailPage
                          openAuthModal={goToLogin}
                        />
                      }
                    />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/checkout/:id" element={<CheckoutPage />} />
                    {/* PAYMENT RESPONSE */}
                    <Route
                      path="/payment-response"
                      element={<PaymentResponse />}
                    />

                    {/* DASHBOARD */}
                    <Route
                      path="/dashboard"
                      element={
                        <Dashboard
                          openAuthModal={goToLogin}
                        />
                      }
                    />

                    {/* PROFILE */}
                    <Route
                      path="/profile"
                      element={<ProfilePage />}
                    />

                    <Route
                      path="/personal-info"
                      element={<ProfilePage />}
                    />

                    {/* CART */}
                    <Route
                      path="/cart"
                      element={<CartPage />}
                    />

                    {/* WISHLIST */}
                    <Route
                      path="/wishlist"
                      element={<WishlistPage />}
                    />

                    {/* REMINDERS */}
                    <Route
                      path="/reminders"
                      element={<RemindersPage />}
                    />

                    {/* TRACK ORDER */}
                    <Route
                      path="/track"
                      element={<TrackOrder />}
                    />

                    <Route
                      path="/track/:code"
                      element={<TrackOrder />}
                    />

                    {/* PERFORMER PUBLIC PROFILE (Facebook style) */}
                    <Route
                      path="/performer/:id"
                      element={<PerformerProfile />}
                    />

                    {/* HOW IT WORKS */}
                    <Route
                      path="/how-it-works"
                      element={<HowItWorksPage />}
                    />

                    {/* FAQS */}
                    <Route
                      path="/faqs"
                      element={<FAQsPage />}
                    />

                  </Routes>

                </div>

                <Footer />

                <AuthModal
                  open={isAuthModalOpen}
                  onClose={() =>
                    setIsAuthModalOpen(false)
                  }
                />

              </div>
            }
          />

        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App
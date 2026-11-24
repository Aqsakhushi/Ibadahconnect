import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
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
import { Toaster } from 'react-hot-toast';
import RequireRole, { AuthSessionGuard } from './components/RequireRole';

// Full-page Auth
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const FAQsPage = lazy(() => import('./pages/FAQsPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const PerformerOnboarding = lazy(() => import('./pages/PerformerOnboarding'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));

// Cart Provider
import { CartProvider } from './context/CartContext';

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOverview = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminOverview })));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminPackages = lazy(() => import('./pages/AdminPackages'));
const AdminBookings = lazy(() => import('./pages/AdminBookings'));
const AdminPerformers = lazy(() => import('./pages/AdminPerformers'));
const AdminHistory = lazy(() => import('./pages/AdminHistory'));
const AdminRules = lazy(() => import('./pages/AdminRules'));

// Public & Sponsor Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const PaymentResponse = lazy(() => import('./pages/PaymentResponse'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const PerformerProfile = lazy(() => import('./pages/PerformerProfile'));

// Performer Pages
const PerformerDashboard = lazy(() => import('./pages/PerformerDashboard'));
const PerformerRulesPage = lazy(() => import('./pages/PerformerRulesPage'));
const SelfFamilyPortal = lazy(() => import('./pages/SelfFamilyPortal'));
const CnicVerifyPage = lazy(() => import('./pages/CnicVerifyPage'));
const AdminCnicPanel = lazy(() => import('./pages/AdminCnicPanel'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Donations = lazy(() => import('./pages/Donations'));
const Settings = lazy(() => import('./pages/Settings'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));

// Netflix-style services catalog
const ServicesPage = lazy(() => import('./pages/ServicesPage'));

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <CartProvider>
      <BrowserRouter>
        <AuthSessionGuard />
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

        <Suspense fallback={null}>
        <Routes>
          {/* =========================
              FULL-PAGE AUTH
          ========================= */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/cnic-verify" element={<RequireRole roles={['Performer']}><CnicVerifyPage /></RequireRole>} />
          <Route path="/admin/cnic" element={<RequireRole roles={['Admin']}><AdminCnicPanel /></RequireRole>} />

          {/* =========================
              ADMIN
          ========================= */}
          <Route path="/admin" element={<RequireRole roles={['Admin']}><AdminDashboard /></RequireRole>}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="performers" element={<AdminPerformers />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="rules" element={<AdminRules />} />
          </Route>

          {/* =========================
              GUIDE
          ========================= */}
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/guide/:categorySlug" element={<GuidePage />} />
          <Route path="/guide/:categorySlug/:subSlug" element={<GuidePage />} />

          {/* =========================
              PERFORMER
          ========================= */}
          <Route path="/performer-onboarding" element={<RequireRole roles={['Performer']}><PerformerOnboarding /></RequireRole>} />
          <Route path="/performer-dashboard" element={<RequireRole roles={['Performer']}><PerformerDashboard /></RequireRole>} />
          <Route path="/performer-rules" element={<RequireRole roles={['Performer']}><PerformerRulesPage /></RequireRole>} />
          <Route path="/self-family-portal" element={<RequireRole roles={['Performer']}><SelfFamilyPortal /></RequireRole>} />
          <Route path="/settings" element={<RequireRole><Settings /></RequireRole>} />
          <Route path="/help-support" element={<RequireRole><HelpSupport /></RequireRole>} />
          <Route path="/live-track/:orderId" element={<TrackOrder />} />

          {/* =========================
              PUBLIC / SPONSOR
          ========================= */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-white font-outfit flex flex-col">

                <Navbar openModal={goToLogin} />

                <div className="pt-16 flex-grow">
                  <Routes>

                    {/* HOME (original) */}
                    <Route
                      path="/"
                      element={
                        <>
                          <HeroSection openAuthModal={goToLogin} />
                          <WhyChooseUs />
                          <ServicesSection />
                          <HowItWorks />
                          <Testimonials />
                        </>
                      }
                    />

                    {/* HOW IT WORKS + FAQS */}
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/faqs" element={<FAQsPage />} />

                    {/* NETFLIX-STYLE SERVICES CATALOG */}
                    <Route path="/services" element={<ServicesPage />} />

                    {/* SERVICE DETAILS (+ /package/:id alias for older links) */}
                    <Route
                      path="/service/:id"
                      element={<ServiceDetailPage openAuthModal={goToLogin} />}
                    />
                    <Route
                      path="/package/:id"
                      element={<ServiceDetailPage openAuthModal={goToLogin} />}
                    />

                    {/* CHECKOUT */}
                    <Route path="/checkout" element={<RequireRole roles={['Sponsor']}><CheckoutPage /></RequireRole>} />
                    <Route path="/checkout/:id" element={<RequireRole roles={['Sponsor']}><CheckoutPage /></RequireRole>} />

                    {/* PAYMENT RESPONSE */}
                    <Route path="/payment-response" element={<PaymentResponse />} />
                    {/* DASHBOARD */}
                    <Route path="/dashboard" element={<RequireRole roles={['Sponsor']}><Dashboard openAuthModal={goToLogin} /></RequireRole>} />

                    {/* PROFILE */}
                    <Route path="/profile" element={<RequireRole roles={['Sponsor']}><ProfilePage /></RequireRole>} />
                    <Route path="/personal-info" element={<RequireRole roles={['Sponsor']}><ProfilePage /></RequireRole>} />

                    <Route path="/bookings" element={<RequireRole roles={['Sponsor']}><MyBookings /></RequireRole>} />
                    <Route path="/notifications" element={<RequireRole roles={['Sponsor']}><Notifications /></RequireRole>} />
                    <Route path="/donations" element={<RequireRole roles={['Sponsor']}><Donations /></RequireRole>} />

                    {/* CART */}
                    <Route path="/cart" element={<CartPage />} />

                    {/* WISHLIST */}
                    <Route path="/wishlist" element={<WishlistPage />} />

                    {/* REMINDERS */}
                    <Route path="/reminders" element={<RemindersPage />} />

                    {/* TRACK ORDER */}
                    <Route path="/track" element={<TrackOrder />} />
                    <Route path="/track/:code" element={<TrackOrder />} />

                    {/* PERFORMER PUBLIC PROFILE */}
                    <Route path="/performer/:id" element={<PerformerProfile />} />

                  </Routes>
                </div>

                <Footer />

                <AuthModal
                  open={isAuthModalOpen}
                  onClose={() => setIsAuthModalOpen(false)}
                />

              </div>
            }
          />

        </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
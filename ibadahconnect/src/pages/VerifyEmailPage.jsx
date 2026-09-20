import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import BrandLogo from '../components/BrandLogo';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification link is missing or incomplete.');
        return;
      }
      try {
        const res = await API.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data?.message || 'Your email has been verified successfully.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#04241b] flex flex-col font-outfit">
      {/* Header with brand logo */}
      <header className="h-16 px-6 flex items-center border-b border-white/10 flex-shrink-0">
        <BrandLogo variant="light" size="md" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        {/* Soft glow background */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#1B5E20]/40 blur-3xl"></div>

        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-gray-100 border-t-[#1B5E20] animate-spin"></div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verifying your email...</h1>
              <p className="text-sm text-gray-500">Please wait a moment while we confirm your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1B5E20] flex items-center justify-center ring-2 ring-[#D4AF37]/60">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-sm text-gray-500 mb-8">{message}</p>
              <Link to="/login" className="inline-block bg-[#1B5E20] text-white font-bold px-8 py-3 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#1B5E20] transition-all">Go to Login</Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center ring-2 ring-red-100">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-sm text-gray-500 mb-8">{message}</p>
              <Link to="/login" className="inline-block bg-[#1B5E20] text-white font-bold px-8 py-3 rounded-full ring-1 ring-[#D4AF37]/60 hover:bg-[#D4AF37] hover:text-[#1B5E20] transition-all">Back to Login</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
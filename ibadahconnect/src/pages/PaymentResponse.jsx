import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PaymentResponse = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing");

  useEffect(() => {
    // URL se query params nikalna (JazzCash data URL mein bhejta hai)
    const params = new URLSearchParams(window.location.search);
    const responseCode = params.get('pp_ResponseCode') || params.get('pp_ResponseCode');
    
    if (responseCode === '000') {
      setStatus("Success");
    } else {
      setStatus("Failed");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 max-w-md w-full text-center">
        {status === "Processing" && <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>}
        {status === "Success" && <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>}
        {status === "Failed" && <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></div>}
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === "Processing" ? "Verifying Payment..." : status === "Success" ? "Payment Successful!" : "Payment Failed"}
        </h2>
        <p className="text-gray-500 mb-8">
          {status === "Success" ? "Your booking has been confirmed. JazakAllah Khair!" : "Your transaction could not be completed. Please try again."}
        </p>
        
        {status !== "Processing" && (
          <button onClick={() => navigate('/dashboard')} className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors">
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentResponse;
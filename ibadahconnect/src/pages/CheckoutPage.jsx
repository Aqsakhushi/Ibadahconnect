import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaGooglePay, FaLock } from 'react-icons/fa';

const CheckoutPage = ({ openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  
  const [reqName, setReqName] = useState(user?.firstName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Pakistan');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [hadiyah, setHadiyah] = useState(0);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [gender, setGender] = useState('Male');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('card');

  const serviceDetails = {
    'umrah-1': { name: "Economy Badal", price: 50000, type: "Umrah Badal", isIbadah: true },
    'hajj-badal': { name: "Hajj Badal", price: 300000, type: "Hajj Badal", isIbadah: true },
    'wheelchair': { name: "Wheelchair Donation", price: 25000, type: "Donation", isIbadah: false },
    'iftar-makkah': { name: "Iftar in Makkah", price: 40000, type: "Donation", isIbadah: false }
  };
  
  const service = serviceDetails[id] || serviceDetails['umrah-1'];
  const grandTotal = service.price + hadiyah;

   const handleNextStep = async () => {
    if (!user) { openAuthModal(); return; }

    if (step === 1) {
      setStep(2); 
    } else if (step === 2) {
      // Validation for Step 2
      setCheckoutError('');
      if (service.isIbadah) {
        if (!name || !relation || !reason) {
          setCheckoutError("Please fill in all required Beneficiary details (Name, Relationship, Reason).");
          return; // Yahan ruk jayega, aage nahi jayega
        }
      } else {
        if (!name) {
          setCheckoutError("Please enter the Recipient's Name.");
          return;
        }
      }
      setStep(3); 
    } else if (step === 3) {
      setLoading(true);
      setCheckoutError('');
      try {
        await API.post('/orders/create', {
          sponsor: user.id,
          serviceType: service.type,
          recipientName: name || "N/A",
          recipientRelation: relation || "N/A",
          price: grandTotal 
        });

        setLoading(false);
        setStep(4); 
      } catch (err) {
        setCheckoutError(err.response?.data?.error || "Error processing order. Please try again.");
        setLoading(false);
      }
    } else if (step === 4) {
      navigate('/dashboard'); 
    }
  };

  const hadiyahOptions = [50, 100, 500, 1000];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      
      <div className="bg-gray-100 text-gray-700 p-4 rounded-xl mb-8 flex items-center gap-3 border border-gray-200">
        <span className="text-xl">✅</span>
        <p className="text-sm font-semibold">"{service.name}" has been added to your cart.</p>
        <Link to="/dashboard" className="ml-auto text-primary text-sm font-bold hover:underline">View cart</Link>
      </div>

      <div className="flex items-center justify-center mb-12">
        {['Billing details', 'Order review', 'Payment'].map((label, idx) => {
          const stepNum = idx + 1;
          return (
            <div key={idx} className="flex items-center">
              <div className={`flex items-center ${step >= stepNum ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${step >= stepNum ? 'bg-primary text-white border-primary' : 'border-gray-300'}`}>{stepNum}</div>
                <span className="ml-2 font-semibold text-sm hidden sm:block">{label}</span>
              </div>
              {idx < 2 && <div className={`w-12 md:w-16 h-1 mx-2 ${step > stepNum ? 'bg-primary' : 'bg-gray-200'}`}></div>}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
        
        {/* Error Box (Alert ki jagah yahan dikhega) */}
        {checkoutError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold">
            {checkoutError}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Requestor's Full Name *</label>
                <input type="text" value={reqName} onChange={(e) => setReqName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Country / Region *</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Street address *</label>
                <input type="text" placeholder="House number and street name" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Town / City *</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State / County *</label>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Postcode / ZIP *</label>
                <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" required />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Hadiyah/Gift</h3>
              <p className="text-xs text-gray-500 mb-4">Hadiyah/Gift for the volunteer who will perform Umrah Badal on behalf of you or your loved ones, as a token of gratitude and appreciation.</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {hadiyahOptions.map(opt => (
                  <button key={opt} type="button" onClick={() => setHadiyah(opt)} className={`py-2 rounded-lg font-bold text-sm border ${hadiyah === opt ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary'}`}>
                    {opt}
                  </button>
                ))}
                <button type="button" onClick={() => setHadiyah(0)} className={`py-2 rounded-lg font-bold text-xs border ${hadiyah === 0 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-800'}`}>
                  No, Thanks!
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Review & Beneficiary Details</h2>
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100 space-y-2 text-sm text-gray-600">
              <p><strong className="text-gray-800">Requestor:</strong> {reqName}</p>
              <p><strong className="text-gray-800">Contact:</strong> {phone} | {email}</p>
              <p><strong className="text-gray-800">Address:</strong> {address}, {city}, {state} {zip}, {country}</p>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="font-bold text-gray-800">{service.name}</span>
                <span className="font-bold text-primary">PKR {service.price.toLocaleString()}</span>
              </div>
              {hadiyah > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hadiyah/Gift</span>
                  <span className="text-gray-600">PKR {hadiyah.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="font-bold text-gray-800">Subtotal</span>
                <span className="font-extrabold text-primary text-lg">PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Beneficiary Information</h3>
            {service.isIbadah ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Beneficiary’s Full Name *</label>
                    <input type="text" placeholder="e.g., Ahmad Ali" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relationship to Requestor *</label>
                    <input type="text" placeholder="e.g., son, daughter" value={relation} onChange={(e) => setRelation(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl flex-1 hover:border-primary">
                      <input type="radio" name="gender" value="Male" checked={gender === 'Male'} onChange={(e) => setGender(e.target.value)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-semibold text-gray-700">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl flex-1 hover:border-primary">
                      <input type="radio" name="gender" value="Female" checked={gender === 'Female'} onChange={(e) => setGender(e.target.value)} className="w-4 h-4 accent-primary" />
                      <span className="text-sm font-semibold text-gray-700">Female</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for Umrah/Hajj Badal *</label>
                  <input type="text" placeholder="e.g., illness, age, deceased" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Any other note you want to mention</label>
                  <textarea rows="3" placeholder="Special instructions or Duas..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none resize-none"></textarea>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name of Deceased / Recipient</label>
                  <input type="text" placeholder="e.g., Ahmad Ali" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note (Optional)</label>
                  <textarea rows="3" placeholder="Any specific instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none resize-none"></textarea>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100 flex justify-between items-center">
              <span className="text-md font-bold text-gray-800">Total Payable</span>
              <span className="text-2xl font-extrabold text-primary">PKR {grandTotal.toLocaleString()}</span>
            </div>

            <div className="space-y-4 mb-6">
              
              <div onClick={() => setPaymentMethod('card')} className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 accent-primary" />
                    <span className="font-bold text-gray-900">Credit/Debit Cards</span>
                  </div>
                  <div className="flex items-center gap-2 text-2xl text-gray-500">
                    <FaCcVisa /><FaCcMastercard /><FaCcAmex /><FaCcDiscover />
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Card Number</label>
                      <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expiry Date</label>
                        <input type="text" placeholder="MM / YY" className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CVV</label>
                        <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div onClick={() => setPaymentMethod('googlepay')} className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'googlepay' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="payment" checked={paymentMethod === 'googlepay'} onChange={() => setPaymentMethod('googlepay')} className="w-5 h-5 accent-primary" />
                  <span className="font-bold text-gray-900">Google Pay</span>
                </div>
                <FaGooglePay className="text-3xl text-gray-700" />
              </div>

            </div>

            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Your order for <span className="font-bold text-primary">{service.name}</span> has been placed successfully. You can now track the progress in real-time.</p>
          </div>
        )}

        <div className="mt-10 flex gap-4">
          {step > 1 && step < 4 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">
              Back
            </button>
          )}
          <button onClick={handleNextStep} disabled={loading} className="flex-1 bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent/90 transition-all text-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processing...</span>
            ) : step === 3 ? (
              <span className="flex items-center gap-2"><FaLock /> Place Order</span>
            ) : step === 4 ? 'Track Your Order' : 'Continue'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
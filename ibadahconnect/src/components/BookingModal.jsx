import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

// All 12 Packages and 6 Services Data
const allServices = [
  { id: 1, name: "Economy Badal", price: 50000, type: "Umrah Badal" },
  { id: 2, name: "Noor Umrah Package", price: 60000, type: "Umrah Badal" },
  { id: 3, name: "Du'a Package", price: 70000, type: "Umrah Badal" },
  { id: 4, name: "Barakah Premium", price: 80000, type: "Umrah Badal" },
  { id: 5, name: "Video Proof Package", price: 90000, type: "Umrah Badal" },
  { id: 6, name: "Express Umrah", price: 100000, type: "Umrah Badal" },
  { id: 7, name: "Standard Plus", price: 110000, type: "Umrah Badal" },
  { id: 8, name: "Jaryah Premium", price: 120000, type: "Umrah Badal" },
  { id: 9, name: "Family Badal", price: 150000, type: "Umrah Badal" },
  { id: 10, name: "Ramadan Special", price: 200000, type: "Umrah Badal" },
  { id: 11, name: "VIP Badal Package", price: 250000, type: "Umrah Badal" },
  { id: 12, name: "Royal Jaryah", price: 300000, type: "Umrah Badal" },
  { id: 101, name: "Hajj Badal", price: 300000, type: "Hajj Badal" },
  { id: 102, name: "Wheelchair Donation", price: 25000, type: "Donation" },
  { id: 103, name: "Roza Kushai (Iftar)", price: 5000, type: "Donation" },
  { id: 104, name: "Tasbeeh Distribution", price: 4000, type: "Donation" },
  { id: 105, name: "Ab-e-Zamzam Delivery", price: 8000, type: "Donation" },
  { id: 106, name: "Iftar for Orphan Girls", price: 40000, type: "Donation" }
];

const BookingModal = ({ isOpen, onClose, preselectedServiceId }) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || 1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Agar kisi specific package pe click kar ke modal khula toh wo select ho
  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  if (!isOpen) return null;

  const selectedService = allServices.find(s => s.id === selectedServiceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!user?.id) {
      setMessage("Error: Please login first to book a service.");
      setLoading(false);
      return;
    }

    try {
      await API.post('/orders/create', {
        sponsor: user.id,
        serviceType: selectedService.type,
        recipientName: name || "N/A",
        recipientRelation: relation || "N/A",
        price: selectedService.price
      });

      setMessage('Success! Order booked successfully.');
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setMessage(err.response?.data?.message || "Error booking order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 py-10">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-primary text-2xl">&times;</button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-primary mb-1" style={{ fontFamily: 'Amiri, serif' }}>Book Service</h2>
          <p className="text-gray-500 text-sm">Fill in the details for the deceased/recipient</p>
        </div>

        {message && (
          <div className={`p-3 rounded-xl mb-4 text-sm text-center font-semibold ${message.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Package / Service</label>
            <select 
              value={selectedServiceId} 
              onChange={(e) => setSelectedServiceId(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors"
            >
              {allServices.map(svc => (
                <option key={svc.id} value={svc.id} className="bg-white">
                  {svc.name} - PKR {svc.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name of Deceased / Recipient</label>
            <input 
              type="text" 
              placeholder="e.g., Ahmad Ali" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" 
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Relation</label>
            <input 
              type="text" 
              placeholder="e.g., Son, Brother" 
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 focus:border-primary focus:bg-white focus:outline-none transition-colors" 
              required 
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500">Total Amount:</span>
              <span className="text-2xl font-extrabold text-primary">PKR {selectedService.price.toLocaleString()}</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-white font-bold py-3.5 rounded-xl hover:bg-accent/90 transition-all duration-300 text-lg shadow-md mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default BookingModal;
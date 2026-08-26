import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaCamera, FaUserCircle, FaIdCard, FaStar, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

const PerformerOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    profilePic: '',
    experience: '',
    umrahProof: ''
  });

  const handleNext = () => setStep(step + 1);
  const handleSkip = () => setStep(step + 1);
  
  const handleFinish = () => {
    navigate('/performer-dashboard');
  };

  // File Upload Handler (Gallery/Camera se image lena)
  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-outfit">
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`w-1/4 h-1.5 rounded-full ${step >= s ? 'bg-primary' : 'bg-gray-200'}`}></div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500">Step {step} of 4</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md relative">
        {/* Skip Button */}
        {step < 4 && (
          <button onClick={handleSkip} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm font-semibold">
            Skip
          </button>
        )}

        {/* STEP 1: Profile Picture */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to IbadahConnect!</h2>
            <p className="text-gray-500 mb-8 text-sm">Let's set up your performer profile. Upload a clear profile picture.</p>
            
            <div className="flex justify-center mb-6">
              {data.profilePic ? (
                <img src={data.profilePic} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-accent" />
              ) : (
                <FaUserCircle className="w-32 h-32 text-gray-200" />
              )}
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <label className="w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200">
                <FaUpload /> Upload from Gallery
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'profilePic')} 
                />
              </label>
              <label className="w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200">
                <FaCamera /> Take Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'profilePic')} 
                />
              </label>
            </div>

            <button onClick={handleNext} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Next <FaArrowRight />
            </button>
          </div>
        )}

        {/* STEP 2: Experience */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Your Experience</h2>
            <p className="text-gray-500 mb-8 text-sm">How many times have you performed Umrah/Hajj?</p>
            
            <div className="space-y-3 mb-6">
              {['1-3 Times', '4-7 Times', '8+ Times'].map(exp => (
                <button 
                  key={exp}
                  onClick={() => setData({...data, experience: exp})}
                  className={`w-full p-4 rounded-xl border-2 text-left font-semibold flex items-center gap-3 transition-colors ${
                    data.experience === exp ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <FaStar className={data.experience === exp ? 'text-primary' : 'text-gray-400'} /> {exp}
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Continue <FaArrowRight />
            </button>
          </div>
        )}

        {/* STEP 3: Umrah Proof */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Umrah Proof</h2>
            <p className="text-gray-500 mb-8 text-sm">Please upload a photo of your previous Umrah Visa or Ticket.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-6">
              {data.umrahProof ? (
                <img src={data.umrahProof} alt="Umrah Proof" className="max-h-48 mx-auto rounded-lg mb-3" />
              ) : (
                <FaIdCard className="text-4xl text-gray-300 mx-auto mb-3" />
              )}
              
              <div className="flex flex-col gap-3">
                <label className="w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200">
                  <FaUpload /> Upload Ticket/Visa
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'umrahProof')} 
                  />
                </label>
                <label className="w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200">
                  <FaCamera /> Take Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={(e) => handleFileUpload(e, 'umrahProof')} 
                  />
                </label>
              </div>
            </div>

            <button onClick={handleNext} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Submit Proof <FaArrowRight />
            </button>
          </div>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <div className="text-center py-8">
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
            <p className="text-gray-500 mb-8 text-sm">Your account has been created as a Performer. You are now ready to receive tasks.</p>
            <button onClick={handleFinish} className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors">
              Go to Performer Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformerOnboarding;
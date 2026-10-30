import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { getCurrentUser, syncLocalUser } from '../utils/auth';
import toast from 'react-hot-toast';
import { FaUpload, FaCamera, FaUserCircle, FaIdCard, FaStar, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

const PerformerOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    profilePic: '',   // SERVER URL after upload (e.g. /uploads/file-xxx.jpg)
    experience: '',
    umrahProof: ''    // SERVER URL after upload
  });
  const [savingField, setSavingField] = useState(''); // profilePic | umrahProof | experience
  const [savingFinish, setSavingFinish] = useState(false);

  // ===== ROLE GUARD: only Performers can use onboarding =====
  useEffect(() => {
    const u = getCurrentUser();
    if (u && (u.role === 'Sponsor' || u.role === 'Admin')) {
      navigate('/', { replace: true });
      return;
    }
    // Already completed onboarding before? Skip straight to dashboard
    if (u && (u.onboardingComplete || u.experience || u.umrahProof)) {
      navigate('/performer-dashboard', { replace: true });
    }
  }, [navigate]);

  const handleNext = () => setStep(step + 1);
  const handleSkip = () => setStep(step + 1);

  // ============================================================
  // REAL SAVE: every file upload goes straight to the server + DB.
  // ============================================================
  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Photo must be under 8 MB.');
      e.target.value = '';
      return;
    }
    setSavingField(field);
    try {
      // 1. Upload to server (multer -> backend/uploads/)
      const fd = new FormData();
      fd.append('file', file);
      const endpoint = field === 'profilePic' ? '/upload/profile-pic' : '/upload/proof';
      const up = await API.post(endpoint, fd);
      const url = up.data.url;

      // 2. Save the URL on the user profile (User model field)
      await API.put(`/auth/user/${getCurrentUser()?.id}`, { [field]: url });

      // 3. Update UI + localStorage
      setData(prev => ({ ...prev, [field]: url }));
      if (field === 'profilePic') {
        localStorage.setItem('performerPic', url);
        syncLocalUser({ profilePic: url });
      }
      toast.success(field === 'profilePic' ? 'Profile picture saved!' : 'Umrah proof saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed — please try again.');
    } finally {
      setSavingField('');
      e.target.value = ''; // allow selecting the same file again
    }
  };

  // Step 2: experience is saved to the DB as well
  const handleExperienceNext = async () => {
    if (!data.experience) { handleNext(); return; }
    setSavingField('experience');
    try {
      await API.put(`/auth/user/${getCurrentUser()?.id}`, { experience: data.experience });
      syncLocalUser({ experience: data.experience });
      handleNext();
    } catch {
      toast.error('Experience not saved — you can update it later in Settings.');
      handleNext();
    } finally {
      setSavingField('');
    }
  };

  // Step 4: Finish — everything is already saved (live save on each step)
  const handleFinish = () => {
    setSavingFinish(true);
    if (data.profilePic) syncLocalUser({ profilePic: data.profilePic });
    syncLocalUser({ onboardingComplete: true });
    toast.success('Setup complete! Welcome to IbadahConnect!');
    // Self/Family performers have their own portal (task dashboard is for Ibadah Team only)
    const u = getCurrentUser();
    setTimeout(() => navigate(u?.performerType === 'Self / Family' ? '/self-family-portal' : '/performer-dashboard'), 600);
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

            <div className="flex justify-center mb-2">
              {data.profilePic ? (
                <img src={data.profilePic} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-accent" />
              ) : (
                <FaUserCircle className="w-32 h-32 text-gray-200" />
              )}
            </div>
            {data.profilePic && (
              <p className="text-[11px] text-green-600 font-bold mb-4 flex items-center justify-center gap-1">
                <FaCheckCircle /> Saved — visible to Admin for verification
              </p>
            )}

            {/* Upload Buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <label className={`w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200 ${savingField === 'profilePic' ? 'opacity-60 pointer-events-none' : ''}`}>
                {savingField === 'profilePic' ? <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span> Uploading...</> : <><FaUpload /> Upload from Gallery</>}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'profilePic')}
                />
              </label>
              <label className={`w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200 ${savingField === 'profilePic' ? 'opacity-60 pointer-events-none' : ''}`}>
                {savingField === 'profilePic' ? 'Wait...' : <><FaCamera /> Take Photo</>}
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
            <button
              onClick={handleExperienceNext}
              disabled={savingField === 'experience'}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {savingField === 'experience' ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</> : <>Continue <FaArrowRight /></>}
            </button>
          </div>
        )}

        {/* STEP 3: Umrah Proof */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Umrah Proof</h2>
            <p className="text-gray-500 mb-8 text-sm">Please upload a photo of your previous Umrah Visa or Ticket. Admin will review this for verification.</p>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-6">
              {data.umrahProof ? (
                <>
                  <img src={data.umrahProof} alt="Umrah Proof" className="max-h-48 mx-auto rounded-lg mb-3" />
                  <p className="text-[11px] text-green-600 font-bold flex items-center justify-center gap-1 mb-3">
                    <FaCheckCircle /> Saved — ready for Admin verification
                  </p>
                </>
              ) : (
                <FaIdCard className="text-4xl text-gray-300 mx-auto mb-3" />
              )}

              <div className="flex flex-col gap-3">
                <label className={`w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200 ${savingField === 'umrahProof' ? 'opacity-60 pointer-events-none' : ''}`}>
                  {savingField === 'umrahProof' ? <><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span> Uploading...</> : <><FaUpload /> Upload Ticket/Visa</>}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'umrahProof')}
                  />
                </label>
                <label className={`w-full bg-gray-50 text-primary font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-2 border border-gray-200 ${savingField === 'umrahProof' ? 'opacity-60 pointer-events-none' : ''}`}>
                  {savingField === 'umrahProof' ? 'Wait...' : <><FaCamera /> Take Photo</>}
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
            <button
              onClick={handleFinish}
              disabled={savingFinish}
              className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {savingFinish ? 'Opening Dashboard...' : 'Go to Performer Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformerOnboarding;
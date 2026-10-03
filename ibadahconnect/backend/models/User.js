const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["Sponsor", "Performer", "Admin"],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // ================= EMAIL VERIFICATION (nodemailer flow) =================
  // NOTE: isVerified (upar wala) PERFORMER verification ke liye hai (Admin approve karta hai)
  // isEmailVerified sirf EMAIL verification ke liye hai — dono alag cheezein hain
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: ''
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  profilePic: {
    type: String,
    default: ''
  },
  // PERFORMER TYPES: "Ibadah Team" (official team) | "Self/Family" (khud/family member)
  performerType: {
    type: String,
    enum: ['Ibadah Team', 'Self/Family'],
    default: 'Ibadah Team'
  },
  // Self/Family member ke liye agency connection (khud Umrah karne par agency se link)
  agencyConnect: {
    type: String,
    enum: ['None', 'Requested', 'Connected'],
    default: 'None'
  },
  agencyName: {
    type: String,
    default: ''
  },
  // Partner agency ki WEBSITE (Self/Family portal par "Visit Agency Website" button isi se banta hai)
  agencyWebsite: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  // ONBOARDING PROOF (visa/ticket photo URL — Admin verification panel mein dikhti hai)
  umrahProof: {
    type: String,
    default: ''
  },
  // ================= NAYE SIGNUP FIELDS (AuthModal se) — sab optional =================
  city: {
    type: String,
    default: ''
  },
  referralCode: {
    type: String,
    default: ''
  },
  // CNIC / Passport number (performer verification block)
  idNumber: {
    type: String,
    default: ''
  },
  languages: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  // Files upload FYP demo mein local hain, sirf flag save hota hai
  hasIdDoc: {
    type: Boolean,
    default: false
  },
  hasProfilePhoto: {
    type: Boolean,
    default: false
  },
  // ================= CNIC VERIFICATION (Feature #2 — Upload + Admin Verify) =================
  // Flow: Performer CNIC number + front/back photos upload karta hai
  // Status flow: Unverified -> Pending -> Verified | Rejected
  // Photos backend/uploads/cnic/ folder mein save hoti hain (multer)
  cnicNumber: {
    type: String,
    default: ''
  },
  cnicFrontImage: {
    type: String,
    default: ''
  },
  cnicBackImage: {
    type: String,
    default: ''
  },
  cnicStatus: {
    type: String,
    enum: ['Unverified', 'Pending', 'Verified', 'Rejected'],
    default: 'Unverified'
  },
  cnicRejectionReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
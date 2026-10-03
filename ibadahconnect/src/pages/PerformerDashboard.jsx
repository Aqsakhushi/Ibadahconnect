import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';
import {
  FaTasks, FaSignOutAlt, FaUserCircle, FaHistory, FaStar, FaRegComment, FaCog, FaWallet,
  FaCommentDots, FaSearch, FaBell, FaPaperPlane, FaTimesCircle, FaCheck, FaUserTag,
  FaMoneyBillWave, FaPrayingHands, FaPlay, FaLink, FaTrophy, FaSyncAlt, FaVideo, FaMosque,
  FaCheckCircle, FaHourglassHalf, FaLock, FaExternalLinkAlt, FaUserCheck, FaScroll, FaMapMarkerAlt, FaRobot, FaClock,
  FaBookOpen, FaKaaba, FaCertificate, FaPrint, FaClipboardList, FaPlane, FaMapMarkedAlt, FaMoon,
  FaCut, FaExclamationTriangle, FaTint, FaChevronDown, FaTshirt, FaWalking, FaAward
} from 'react-icons/fa';

// ═══════════════════════════════════════════════════════════════════
//  IBADAHCONNECT — PERFORMER PORTAL v5
//  v5: Umrah Journey milestones (click-to-advance) + Auto Certificate
//      + Hajj & Umrah Guide tab (Sponsor + Performer guide content)
//  v4: Main-site branding (KaabaIcon + wordmark) + full Notification bell
// ═══════════════════════════════════════════════════════════════════

/* ---------------- MAIN-SITE BRAND ICON (Dashboard jaisa exact logo) ---------------- */
const KaabaIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
    <path d="M3.5 7 12 11.5 20.5 7" />
    <path d="M12 11.5v10" />
    <path d="M7.2 4.9l8.5 4.7" />
  </svg>
);

/* ---------------- MODULE HELPERS ---------------- */
const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Kya yeh date aaj ki hai? (Daily limit rule)
const isSameDay = (a) => {
  if (!a) return false;
  const d1 = new Date(a), d2 = new Date();
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

// Notification type → static tailwind classes (dynamic classes JIT mein break hote hain)
const NOTIF_STYLE = {
  red:    { chip: 'bg-red-100 text-red-600',       badge: 'bg-red-100 text-red-600 border-red-200' },
  purple: { chip: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100 text-purple-600 border-purple-200' },
  blue:   { chip: 'bg-blue-100 text-blue-600',     badge: 'bg-blue-100 text-blue-600 border-blue-200' },
  green:  { chip: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  gold:   { chip: 'bg-amber-100 text-amber-600',   badge: 'bg-amber-100 text-amber-600 border-amber-200' },
  amber:  { chip: 'bg-amber-50 text-amber-700',    badge: 'bg-amber-100 text-amber-600 border-amber-200' },
};

/* ═══════════════════════════════════════════════════════════════════
   UMRAH JOURNEY — 5 ritual steps (backend milestones se exact 1:1 map)
   Backend: Ehram → Tawaf → Sa'i (Safa Marwa) → Taqsir/Halq → Dua
   ═══════════════════════════════════════════════════════════════════ */
const JOURNEY_STEPS = [
  {
    title: 'Ihram',
    arabic: 'إحرام',
    subtitle: 'Entering the Sacred State',
    icon: FaTshirt,
    points: [
      'Ghusl (mukammal paaki) karein — yeh sunnah tayyari hai',
      'Mard: 2 safaid unstitched kapre — Izar (lower) + Rida (upper) • Khawateen: loose, saada shar\'i libas (chehra aur hatheliyan nazar)',
      'Miqat par Niyyah karein: "Allahumma inni uridul \'Umrah" — isi lamhay se ihram ki hudoood shuru',
      'Ab se: perfume nahi, baal/nakhun nahi katne, jhagda nahi — sirf Ibadah ka mahool',
    ],
    dua: {
      arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
      translit: 'Labbaik Allahumma Labbaik, Labbaika laa sharika laka labbaik, innal-hamda wan-ni\'mata laka wal-mulk, laa sharika lak',
      meaning: 'Main hazir hoon Allahumma, main hazir hoon! Tera koi shareek nahi — saari tareef, ne\'mat aur badshahi Tere liye hain.',
    },
  },
  {
    title: 'Tawaf',
    arabic: 'طواف',
    subtitle: '7 Circuits around the Kaaba',
    icon: FaKaaba,
    points: [
      'Masjid al-Haram mein daaye qadam se dakhil honein aur dua karein',
      'Hajar al-Aswad (Black Stone) se shuru — Kaaba ke 7 chakkar anti-clockwise, har chakkar par istilaam (kiss/point)',
      'Rukn Yamani se Hajar al-Aswad tak yeh dua parhein (neeche di hui)',
      '7 chakkar ke baad Maqam Ibrahim ke peechay 2 rak\'ah, phir Zamzam piyein aur dil se dua karein',
    ],
    dua: {
      arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
      translit: 'Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina \'adhab an-nar',
      meaning: 'Aye humare Rab! Humein dunya mein bhi bhalayi de, Aakhirat mein bhi bhalayi de, aur humein aag ke azaab se bacha.',
    },
  },
  {
    title: 'Sa\'i (Safa Marwa)',
    arabic: 'سعي',
    subtitle: 'Safa ↔ Marwa — 7 Laps',
    icon: FaWalking,
    points: [
      'Safa pahari se shuru karein — Safa se Marwa = 1 chakki, wapas = 2 (youn 7 chotiyaan, Marwa par khatam)',
      'Har pahari par Kaaba ki taraf rukh kar ke haath utha kar dua karein',
      'Do sabz (green) lights ke darmiyan mard halki dorag (harwalah) karein — sunnah',
      'Hajar (AS) ko yaad karein — unhi ki talaash mein Allah ne Zamzam rawana farmaya tha',
    ],
    dua: {
      arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      translit: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa \'ala kulli shai\'in qadir',
      meaning: 'Allah ke siwa koi mabood nahi, Uska koi shareek nahi; badshahi aur tareef Usi ke liye hai — aur Woh har cheez par qaadir hai.',
    },
  },
  {
    title: 'Taqsir / Halq',
    arabic: 'حلق وتقصير',
    subtitle: 'Hair Cutting — Exit from Ihram',
    icon: FaCut,
    points: [
      'Mard: sar ke tamam baal mundwa dein (Halq — afzal) ya sab baal barabar chhote kar lein (Taqsir)',
      'Khawateen: sirf ungli ke por (fingertip) ke barabar baal kaat lein',
      'Baal katne ke sath hi ihram ki hudoood khatam — Umrah mubarak!',
      'Ab normal libas aur perfume dono ki ijazat hai',
    ],
    dua: {
      arabic: 'تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ',
      translit: 'Taqabbal-Allahu minna wa minkum',
      meaning: 'Allah ta\'ala hum se aur tum se (yeh Ibadah) qabool farmaye.',
    },
  },
  {
    title: 'Dua for Recipient',
    arabic: 'دعا',
    subtitle: 'Final Dua & Completion',
    icon: FaPrayingHands,
    points: [
      'Sajda / dua mein recipient ke liye dil se dua karein — sehat, maghfirat aur barkat',
      'Sponsor aur uske ghar walon ke liye bhi khair ki dua karein',
      'Chahen to dua ka photo/notes bhi proof mein share kar dein',
      'Yeh aakhri milestone hai — complete hote hi aapka Certificate auto-generate ho jayega!',
    ],
    dua: {
      arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ',
      translit: 'Rabbana taqabbal minna innaka Antas-Sami\'ul-\'Aleem',
      meaning: 'Aye humare Rab! Hum se (yeh Ibadah) qabool farma — beshak Tu Sunne Wala, Sab Kuch Jaanne Wala hai.',
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════
   HAJJ & UMRAH GUIDE DATA (Sponsor + Performer dono ke liye)
   Structure hajjumrahplanner.com guide ke mutabiq — 7 categories
   ═══════════════════════════════════════════════════════════════════ */
const GUIDE_CATEGORIES = [
  { name: 'Planning & Preparation', articles: 19, icon: FaClipboardList, chip: 'bg-blue-50 text-blue-600 border-blue-100', desc: 'Visa, documents, budget, packing list aur spiritual tayyari' },
  { name: 'Travel', articles: 8, icon: FaPlane, chip: 'bg-sky-50 text-sky-600 border-sky-100', desc: 'Flights, hotels, Jeddah–Makkah–Madinah transport tips' },
  { name: 'Umrah', articles: 26, icon: FaKaaba, chip: 'bg-emerald-50 text-emerald-600 border-emerald-100', desc: 'Poora Umrah step-by-step — Ihram se Halq tak' },
  { name: 'Hajj', articles: 46, icon: FaMosque, chip: 'bg-amber-50 text-amber-600 border-amber-100', desc: 'Hajj ke tamam manasik — 8 se 13 Zil Hajj tak' },
  { name: 'Makkah', articles: 82, icon: FaMapMarkedAlt, chip: 'bg-rose-50 text-rose-600 border-rose-100', desc: 'Masjid al-Haram, Zamzam, Maqam Ibrahim aur historical sites' },
  { name: 'Madinah', articles: 83, icon: FaMoon, chip: 'bg-indigo-50 text-indigo-600 border-indigo-100', desc: 'Masjid an-Nabawi, Rawdah, Uhud, Masjid Quba' },
  { name: "The Prophet's Hajj", articles: 10, icon: FaScroll, chip: 'bg-purple-50 text-purple-600 border-purple-100', desc: 'Sunnah tareeqa — Nabi ﷺ ne khud Hajj kaise perform kiya' },
];

/* Rites of Umrah — detailed accordion content */
const GUIDE_SECTIONS = [
  {
    id: 'intro',
    title: 'Umrah: Introduction',
    arabic: 'عمرة',
    read: '2 min read',
    icon: FaKaaba,
    intro: 'Umrah saal ke mausam-e-Hajj ke ilawa har din perform ki ja sakti hai — isay "choti Hajj" bhi kehte hain. Hajj ke andar bhi Umrah ek lazmi hissa hai (Umrat-ut-Tamattu). IbadahConnect par aap sponsor ki taraf se kisi ke liye Badal Umrah perform karte hain — bilkul inhi steps ke sath.',
    points: [
      'Umrah ke 4 arkan: Ihram → Tawaf → Sa\'i → Halq/Taqsir — bilkul wahi jo aapke task milestones mein hain',
      'Ihram shart hai — Ihram ke bagair Umrah shuru hi nahi hoti',
      'Tawaf aur Sa\'i arkan (farz) hain; Halq/Taqsir wajib hai',
      'Har step ka proof (video/photo + GPS) tracking page par sponsor ko nazar aata hai',
    ],
    dua: null,
    penalties: null,
  },
  {
    id: 'ihram',
    title: 'Ihram',
    arabic: 'إحرام',
    read: '4 min read',
    icon: FaTshirt,
    intro: 'Ihram ka matlab sirf safed kapre nahi — yeh ek "sacred state" hai jis mein Nabi ﷺ ki batayi hui hudoood (limitations) lazmi hain. Niyyat aur Talbiyah ke sath yeh state shuru hoti hai.',
    points: [
      'Ghusl karein (purity ki sunnah), khushboo lagana sirf ghusl se PEHLE — phir ihram ke kapre pehnein',
      'Mard: 2 unstitched safaid chadar — Izar (lower body) + Rida (upper body); sir (sar) nazar rehta hai',
      'Khawateen: apna normal loose, shar\'i libas ihram hai — chehra aur hatheliyan nazar rehti hain; niqab/gloves ihram mein nahi',
      'Miqat (apne route ka muqarrar point — Qarnul-Manazil, Yalamlam, Dhul-Hulaifah waghera) se pehle ya Miqat par hi ihram lazmi',
      'Niyyah: "Allahumma inni uridul \'Umrah" — phir foran Talbiyah shuru (3 dafa bulandi se)',
      'Hudoood: perfume nahi, baal/nakhun katana nahi, shikar nahi, jhagda/fahash baat nahi, mard stitched kapre/sar dhakna nahi',
      'Ihram mein namaz-e-ihram (2 rak\'ah) parhna sunnat hai',
    ],
    dua: {
      arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
      translit: 'Labbaik Allahumma Labbaik, Labbaika laa sharika laka labbaik, innal-hamda wan-ni\'mata laka wal-mulk, laa sharika lak',
      meaning: 'Main hazir hoon Allahumma! Tera koi shareek nahi — saari tareef, ne\'mat aur badshahi Tere liye hain.',
    },
    penalties: null,
  },
  {
    id: 'tawaf',
    title: 'Tawaf',
    arabic: 'طواف',
    read: '4 min read',
    icon: FaKaaba,
    intro: 'Tawaf = Kaaba ke 7 chakkar. Yeh Umrah ka sab se zyada pehchana janya rukn hai. Wuzu Tawaf ki shart hai — be-wuzu Tawaf jaiz nahi.',
    points: [
      'Masjid al-Haram mein daaye qadam se entry + dua: "Bismillah, Allahumma salli \'ala Muhammad"',
      'Shuru Hajar al-Aswad se — corner jahan Black Stone laga hai; har chakkar ke shuru par istilaam (door se ishara bhi kafi)',
      'Direction: Kaaba ke LEFT haath rakh kar anti-clockwise — 7 mukammal chakkar',
      'Rukn Yamani (4th corner) se Hajar al-Aswad tak: "Rabbana atina fid-dunya hasanah..." parhein',
      'Mard pehle 3 chakkar mein tez chalne (ramal) ki sunnat par amal kar sakte hain',
      '7 chakkar ke baad Maqam Ibrahim ke peechay 2 rak\'ah (Surah Al-Kafirun + Al-Ikhlas sunnat hai)',
      'Phir Zamzam piyein — 3 sips, dua ke sath: "Allahumma inni as\'aluka \'ilman nafi\'an..."',
    ],
    dua: {
      arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
      translit: 'Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina \'adhab an-nar',
      meaning: 'Aye humare Rab! Dunya aur Aakhirat dono mein bhalayi de, aur humein aag ke azaab se bacha.',
    },
    penalties: null,
  },
  {
    id: 'sai',
    title: 'Sa\'i',
    arabic: 'سعي',
    read: '3 min read',
    icon: FaWalking,
    intro: 'Sa\'i = Safa aur Marwa ki pahariyon ke darmiyan 7 chotiyaan. Yeh Hajar (AS) ki mohabbat aur tawakkul ki zindah jamaat hai — unhone apne bete Ismail (AS) ke liye paani ki talaash mein yeh raasta 7 dafa tay kiya.',
    points: [
      'Tawaf ke baad hi Sa\'i hoti hai — Safa pahari se shuru, Marwa par khatam',
      'Ginti: Safa → Marwa = 1, Marwa → Safa = 2 ... youn 7 chotiyaan (Marwa par aakhir)',
      'Har pahari par charrh kar Kaaba ki taraf rukh kar ke haath utha lein — tasbeeh, dua, tahleel karein',
      'Do sabz lights ke darmiyan mard "harwalah" (halki dorag) karein — Hajar (AS) ki yaad mein sunnah',
      'Sa\'i mein wuzu behtar hai (shart nahi); thakaan ho to baith kar aaram bhi jaiz',
      'Dua ka khaas waqt — khaaskar Safa/Marwa ke upar aur Mas\'aa ke darmiyan',
    ],
    dua: {
      arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      translit: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa \'ala kulli shai\'in qadir',
      meaning: 'Allah ke siwa koi mabood nahi — badshahi aur tareef Usi ke liye, aur Woh har cheez par qaadir hai.',
    },
    penalties: null,
  },
  {
    id: 'halq',
    title: 'Halq & Taqsir',
    arabic: 'حلق وتقصير',
    read: '2 min read',
    icon: FaCut,
    intro: 'Halq (sar ke baal mundwana) aur Taqsir (chhoti karna) — Umrah ka aakhri rukn. Isi ke sath ihram ki hudoood khatam hoti hain aur Umrah mukammal hoti hai.',
    points: [
      'Mard: tamam sar ke baal mundwa dein (Halq — afzal) YA sab baal barabar chhote kar lein (Taqsir)',
      'Khawateen: sirf ungli ke por (fingertip) ke barabar baal kaatein — se sakht ehtiyaat ke sath',
      'Sirf chandi/steel se banay huay saaf auzaar istemal karein; naye/munjamah blade hi hon',
      'Baal katne ke baad ihram khatam — perfume, stitched kapre, sab ijazat',
      'Dua ke liye khaas lamha: halq/taqsir ke baad ki dua qabooliyat ka waqt samjhi jaati hai',
    ],
    dua: {
      arabic: 'تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ',
      translit: 'Taqabbal-Allahu minna wa minkum',
      meaning: 'Allah ta\'ala hum se aur tum se (yeh Ibadah) qabool farmaye.',
    },
    penalties: null,
  },
  {
    id: 'violations',
    title: 'Violations & Penalties',
    arabic: 'خطايا و کفارے',
    read: '3 min read',
    icon: FaExclamationTriangle,
    intro: 'Ihram ki hudoood todne par "jinayat" hoti hai, jis ka kaffarah dena lazmi ho jata hai. Neeche common violations aur unke penalties hain — serious cases mein apne imam/aalim se zaroor mashwara karein.',
    points: [
      'Kaffarah ki 3 alag shaklein: Dum (badana/qurbani), Sadaqah (miskeen ko khana), ya Roza',
      'Ihram ki hudoood sirf Ihram state ke doran lagi hoti hain — Halq/Taqsir ke baad sab khatam',
      'Galti se hui khata aur jaan-boojh kar ki jinayat mein farq hota hai — aalim se poochein',
    ],
    dua: null,
    penalties: [
      { rule: 'Miqat par ihram bandhe bagair Haram mein daakhil hona', penalty: 'Dum — 1 badana (goat) Haram ke andar' },
      { rule: 'Perfume / khushboo istemal karna', penalty: 'Sadaqah ya Dum' },
      { rule: 'Mard ka sar / chehra dhakna', penalty: 'Sadaqah ya Dum' },
      { rule: 'Aurat ka niqab ya gloves pehen-na', penalty: 'Sadaqah' },
      { rule: 'Baal ya nakhun katana', penalty: 'Sadaqah ya 3 din roza ya Dum' },
      { rule: 'Mard ka stitched kapra ya poori mozon wala juta', penalty: 'Sadaqah' },
      { rule: 'Shikar karna / janwar ka nuqsan', penalty: 'Badana (jis qadar nuqsan hua)' },
      { rule: 'Jhagda, gussa ya fuzool baat-cheet', penalty: 'Tawbah + Dum/Sadaqah (severity ke mutabiq)' },
    ],
  },
];

const PerformerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [profilePic, setProfilePic] = useState(localStorage.getItem('performerPic') || '');
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  // Proof Modal State (window.prompt ki jagah professional modal)
  const [proofModal, setProofModal] = useState(null); // { orderId, milestoneIndex, step }
  const [proofUrl, setProofUrl] = useState('');
  const [proofSaving, setProofSaving] = useState(false);

  // AUTOMATIC LOCATION state (Meeting requirement #2)
  const [locStatus, setLocStatus] = useState('idle'); // idle | capturing | captured | error
  const [proofLocation, setProofLocation] = useState(null); // { lat, lng, capturedAt }

  // OCR PROOF VERIFICATION state (Meeting requirement #1)
  const [ocrStatus, setOcrStatus] = useState('idle'); // idle | checking | done | skip | error
  const [ocrResult, setOcrResult] = useState(null);   // { text, confidence, matched, score, suggestion }

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Admin', text: 'Assalamu Alaikum! Welcome to IbadahConnect Performer Portal.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // ═══ v4 NOTIFICATION SYSTEM ═══
  const [showNotifs, setShowNotifs] = useState(false);
  const [bellBounce, setBellBounce] = useState(false);
  const [readNotifs, setReadNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_read_notifs')) || []; } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem('pf_read_notifs', JSON.stringify(readNotifs.slice(0, 200))); } catch (e) {}
  }, [readNotifs]);

  // ═══ v5 AUTO CERTIFICATE ═══
  const [certificate, setCertificate] = useState(null); // { order, issuedAt }

  // ═══ v5 GUIDE accordion ═══
  const [openGuide, setOpenGuide] = useState(0);

  // ═══ ROLE GUARD: Sirf Performer role is portal ko access kar sakta hai ═══
  useEffect(() => {
    const r = String(user?.role || '').toLowerCase();
    if (r && r !== 'performer') {
      toast.error('Sponsor accounts cannot access the Performer Portal.');
      navigate('/dashboard');
    }
  }, []);

  // ---------- DATA HELPERS ----------
  // FIX: backend performer ko populate karke OBJECT bhejta hai, isliye _id nikalna zaroori hai
  const performerIdOf = (o) => (o.performer ? (typeof o.performer === 'object' ? o.performer._id : o.performer) : null);
  const isMine = (o) => performerIdOf(o) === user.id;

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/orders/all');
      setAllOrders(res.data);
    } catch (err) {
      if (!silent) toast.error('Tasks load nahi huay. Server check karein.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // har 5 second silent refresh — naye requests foran nazar aayenge
    const timer = setInterval(() => fetchTasks(true), 5000);
    return () => clearInterval(timer);
  }, [fetchTasks]);

  // ---------- DERIVED DATA (Real DB se) ----------
  const myAssigned = allOrders.find(o => isMine(o) && o.status === 'Assigned');
  const myActive = allOrders.find(o => isMine(o) && o.status === 'In Progress');
  const myCompleted = allOrders.filter(o => isMine(o) && o.status === 'Completed');
  const newRequests = allOrders.filter(o => {
    if (!o || o.status !== 'Pending') return false;
    const sponsorId = o.sponsor?._id || o.sponsor;
    if (String(sponsorId) === String(user?.id)) return false;
    const created = new Date(o.createdAt).getTime();
    if (isNaN(created) || Date.now() - created > 24 * 60 * 60 * 1000) return false;
    return true;
  });
  const isBusy = !!(myAssigned || myActive);
  const activeTask = myActive || myAssigned;

  // ═══ v5: Umrah/Hajj Badal order? (Journey milestones 4+ ho to journey mode) ═══
  const isRitualOrder = (o) => /umrah|hajj/i.test(o?.serviceType || '') && (o?.milestones?.length || 0) >= 4;

  // Progress helpers
  const milestoneProgress = (order) => {
    const ms = order.milestones || [];
    const done = ms.filter(m => m.isCompleted).length;
    return { done, total: ms.length, pct: ms.length ? Math.round((done / ms.length) * 100) : 0 };
  };

  // ═══ INSTANT ALERT — naye requests par toast + beep + bell bounce ═══
  const prevRequestsRef = useRef(0);
  const firstLoadRef = useRef(true);
  useEffect(() => {
    const count = newRequests.length;
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      prevRequestsRef.current = count;
      return;
    }
    if (count > prevRequestsRef.current) {
      const fresh = count - prevRequestsRef.current;
      toast.success(`🔔 ${fresh} new task request${fresh > 1 ? 's' : ''} received!`, { duration: 6000 });
      setBellBounce(true);
      setTimeout(() => setBellBounce(false), 1800);
      try {
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.9);
        osc.start();
        osc.stop(actx.currentTime + 1);
      } catch (e) {}
    }
    prevRequestsRef.current = count;
  }, [newRequests.length]);

  // MEETING RULE: "Hide Donation Price" — Donation request ka amount sirf Admin/Sponsor dekh sakte hain.
  const isDonation = (o) => o?.serviceType === 'Donation';
  const PRICE_HIDDEN = '🔒 Price Hidden — Rules & Regulations Apply';
  const totalEarnings = myCompleted.filter(o => !isDonation(o)).reduce((sum, o) => sum + Math.round((o.price || 0) * 0.85), 0);
  const pendingEarnings = myActive && !isDonation(myActive) ? Math.round((myActive.price || 0) * 0.85) : 0;

  // ═══ DAILY LIMIT — 1 din = sirf 1 task (active hai ya aaj complete kiya) ═══
  const acceptedToday = (allOrders || []).some(o => {
    if (!o) return false;
    const pid = o.performer?._id || o.performer;
    if (String(pid) !== String(user?.id)) return false;
    if (o.status === 'Assigned' || o.status === 'In Progress') return true;
    if (o.status === 'Completed' && isSameDay(o.completedAt)) return true;
    return false;
  });

  // ---------- ACTIONS ----------
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleStartTask = async (orderId) => {
    // daily limit guard
    if (acceptedToday) {
      toast.error('Daily limit reached — you can accept only 1 task per day. Come back tomorrow.');
      return;
    }
    try {
      const res = await API.put(`/orders/accept-task/${orderId}`, { performerId: user.id });
      toast.success(res.data.message || 'Task started! Umrah Journey unlock ho gayi.');
      await fetchTasks(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting task.');
    }
  };

  const openProofModal = (order, milestoneIndex, step) => {
    setProofUrl('');
    setOcrStatus('idle');
    setOcrResult(null);
    setProofModal({ orderId: order._id, milestoneIndex, step, serviceType: order.serviceType, price: order.price });
  };

  // AUTOMATIC LOCATION: Proof modal khulte hi browser se GPS coordinates auto-capture
  useEffect(() => {
    if (proofModal && navigator.geolocation) {
      setLocStatus('capturing');
      setProofLocation(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setProofLocation({
            lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
            lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
            capturedAt: new Date().toISOString()
          });
          setLocStatus('captured');
        },
        () => setLocStatus('error'),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, [proofModal]);

  // OCR PROOF VERIFICATION: image (receipt/photo) link par AI text-extraction check
  const looksLikeImage = (url) => /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url) || url.startsWith('data:image');

  const runOcrCheck = async (url) => {
    if (!url || !looksLikeImage(url)) return;
    setOcrStatus('checking');
    try {
      const res = await API.post('/proof/ocr-check', {
        proofUrl: url,
        serviceType: proofModal?.serviceType || '',
        // PRIVACY: Donation orders par amount kabhi nahi bhejte (price hidden rule)
        amount: proofModal && !isDonation(proofModal) ? proofModal.price : undefined
      });
      setOcrResult(res.data.ocr || null);
      setOcrStatus(res.data.skippable ? 'skip' : 'done');
      if (res.data.skippable) toast(res.data.message, { icon: 'ℹ' });
    } catch {
      setOcrStatus('error');
    }
  };

  // Auto-run: image link paste hote hi (700ms debounce) AI check khud shuru
  useEffect(() => {
    if (!proofModal || !proofUrl.trim() || !looksLikeImage(proofUrl.trim())) return;
    const t = setTimeout(() => runOcrCheck(proofUrl.trim()), 700);
    return () => clearTimeout(t);
  }, [proofUrl, proofModal]);

  const submitProof = async () => {
    if (!proofUrl.trim()) {
      toast.error('Proof link enter karein (YouTube / Drive link).');
      return;
    }
    setProofSaving(true);
    try {
      const res = await API.put(`/orders/update-milestone/${proofModal.orderId}`, {
        milestoneIndex: proofModal.milestoneIndex,
        proofUrl: proofUrl.trim(),
        proofLocation: proofLocation || undefined,
        proofOcr: ocrResult || undefined
      });
      const completedOrder = allOrders.find(o => o._id === proofModal.orderId);
      setProofModal(null);
      if (res.data.orderCompleted) {
        toast.success('Mubarak ho! Saare milestones complete — Order COMPLETED! 🎉', { duration: 5000 });
        // ═══ v5: AUTO CERTIFICATE — aakhri milestone par certificate foran generate ═══
        if (completedOrder) setCertificate({ order: completedOrder, issuedAt: new Date().toISOString() });
      } else {
        toast.success(`Milestone complete! (${res.data.completedMilestones}/${res.data.totalMilestones})${ocrResult?.suggestion === 'verified' ? ' — AI Verified ✓' : ''}`);
      }
      await fetchTasks(true);
    } catch (err) {
      toast.error('Error updating milestone.');
    } finally {
      setProofSaving(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages([...chatMessages, { sender: 'Me', text: newMessage }]);
    setNewMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'Admin', text: 'Noted. JazakAllah Khair.' }]);
    }, 1500);
  };

  // ═══ v4 NOTIFICATION FEED — har important event ek notification card ═══
  const notifications = (() => {
    const list = [];
    // 1) Pending new requests (24h fresh)
    newRequests.forEach(o => list.push({
      key: `req-${o._id}`, type: 'New Request', color: 'red', icon: <FaBell />,
      title: `${o.serviceType} — New Task Request`,
      desc: `Recipient: ${o.recipientName} • Sponsor: ${o.sponsor?.firstName} ${o.sponsor?.lastName}`,
      time: o.createdAt, tab: 'tasks',
    }));
    // 2) Admin assigned
    if (myAssigned) list.push({
      key: `asg-${myAssigned._id}`, type: 'Assigned', color: 'purple', icon: <FaUserTag />,
      title: `${myAssigned.serviceType} — Assigned by Admin`,
      desc: 'Start Task dabayein — Umrah Journey ke milestones unlock ho jayenge.',
      time: myAssigned.updatedAt || myAssigned.createdAt, tab: 'tasks',
    });
    // 3) In Progress + milestone progress
    if (myActive) {
      const prog = milestoneProgress(myActive);
      list.push({
        key: `prog-${myActive._id}`, type: 'In Progress', color: 'blue', icon: <FaKaaba />,
        title: `${myActive.serviceType} — Umrah Journey Chal Rahi Hai`,
        desc: prog.done > 0
          ? `Step ${prog.done}/${prog.total} complete — agla step: ${(myActive.milestones?.[prog.done]?.step) || 'Next milestone'}`
          : 'Milestones unlock ho gaye — pehla step (Ihram) se shuru karein.',
        time: myActive.updatedAt || myActive.createdAt, tab: 'tasks',
      });
    }
    // 4) Latest completed (certificate ready!)
    const latestDone = myCompleted[0];
    if (latestDone) list.push({
      key: `done-${latestDone._id}`, type: 'Completed', color: 'gold', icon: <FaTrophy />,
      title: `${latestDone.serviceType} — Completed! Certificate Ready 🎉`,
      desc: 'Aapka Certificate auto-generate ho gaya hai — History tab mein "Certificate" se dekhein.',
      time: latestDone.updatedAt, tab: 'history',
    });
    // 5) Daily limit reminder
    if (acceptedToday && !isBusy) list.push({
      key: 'daily-limit', type: 'Daily Limit', color: 'amber', icon: <FaHourglassHalf />,
      title: 'Daily limit reached',
      desc: 'Aaj 1 task ho chuka hai — naye requests kal nazar aayenge.',
      time: new Date().toISOString(), tab: 'tasks',
    });
    return list.sort((a, b) => new Date(b.time) - new Date(a.time));
  })();
  const unreadCount = notifications.filter(n => !readNotifs.includes(n.key)).length;
  const markAllRead = () => setReadNotifs(notifications.map(n => n.key));

  const menuItems = [
    { id: 'tasks', icon: <FaTasks />, label: 'Dashboard' },
    { id: 'guide', icon: <FaBookOpen />, label: 'Hajj & Umrah Guide' },
    { id: 'history', icon: <FaHistory />, label: 'History' },
    { id: 'feedbacks', icon: <FaRegComment />, label: 'Feedbacks' },
    { id: 'earnings', icon: <FaWallet />, label: 'Earnings' },
    { id: 'settings', icon: <FaCog />, label: 'Settings' },
  ];

  // ---------- MILESTONE CHECKLIST (Donation / non-ritual orders ke liye fallback) ----------
  const MilestoneList = ({ order }) => {
    const prog = milestoneProgress(order);
    return (
      <div>
        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</p>
            <p className="text-xs font-bold text-primary">{prog.done} / {prog.total} Milestones ({prog.pct}%)</p>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${prog.pct}%` }}></div>
          </div>
        </div>

        <div className="space-y-2.5">
          {(order.milestones || []).map((m, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${m.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-primary/40'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${m.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                  {m.isCompleted ? <FaCheck className="text-xs" /> : idx + 1}
                </span>
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${m.isCompleted ? 'text-green-700 line-through' : 'text-gray-700'}`}>{m.step}</p>
                  {m.isCompleted && m.proofUrl && (
                    <a href={m.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <FaVideo /> View Proof <FaExternalLinkAlt className="text-[9px]" />
                    </a>
                  )}
                  {m.isCompleted && m.proofLocation && (
                    <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                      <FaMapMarkerAlt /> Location Verified ({m.proofLocation.lat}, {m.proofLocation.lng})
                    </p>
                  )}
                  {m.isCompleted && m.proofOcr?.suggestion === 'verified' && (
                    <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                      <FaRobot /> AI Verified — OCR (score {m.proofOcr.score})
                    </p>
                  )}
                </div>
              </div>
              {!m.isCompleted ? (
                <button
                  onClick={() => openProofModal(order, idx, m.step)}
                  className="bg-primary text-white font-bold px-3.5 py-2 rounded-lg text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                >
                  <FaCheckCircle /> Complete + Proof
                </button>
              ) : (
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">DONE</span>
              )}
            </div>
          ))}
        </div>

        {/* Completion Banner */}
        {prog.pct === 100 && (
          <div className="mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 flex items-center gap-3 text-white">
            <FaTrophy className="text-3xl" />
            <div>
              <p className="font-extrabold">Mubarak Ho! Task Completed! 🎉</p>
              <p className="text-xs opacity-90">Order status "Completed" ho gaya. Sponsor ko proof videos mil gaye hain.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  v5 UMRAH JOURNEY — ek waqt mein EK step nazar aata hai.
  //  Performer click karta jaye — milestone advance hota jaye —
  //  aakhri step par Certificate auto-generate ho jata hai.
  //  Backend milestones se exact 1:1 mapping (index = index).
  // ═══════════════════════════════════════════════════════════════
  const UmrahJourney = ({ order }) => {
    const ms = order.milestones || [];
    const prog = milestoneProgress(order);
    const activeIdx = ms.findIndex(m => !m.isCompleted);

    return (
      <div>
        {/* Journey header + progress */}
        <div className="mb-5 bg-gradient-to-r from-[#0F3D14] to-[#1B5E20] rounded-xl p-4 text-white relative overflow-hidden">
          <KaabaIcon className="absolute right-3 top-2 w-16 h-16 text-white/10" />
          <div className="flex justify-between items-center mb-2 relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
              <FaKaaba className="text-[#D4AF37]" /> Umrah Journey — {order.recipientName} ke liye
            </p>
            <p className="text-xs font-bold text-[#D4AF37]">{prog.done} / {prog.total} Steps ({prog.pct}%)</p>
          </div>
          <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-300 rounded-full transition-all duration-700" style={{ width: `${prog.pct}%` }}></div>
          </div>
          {activeIdx > -1 ? (
            <p className="text-[11px] text-white/75 mt-2 relative z-10">
              Aaj ka step: <span className="font-bold text-[#D4AF37]">Step {activeIdx + 1} — {(JOURNEY_STEPS[activeIdx] || {}).title || ms[activeIdx]?.step}</span>. Poori ritual guide sidebar ke "Hajj &amp; Umrah Guide" tab mein hai.
            </p>
          ) : (
            <p className="text-[11px] text-[#D4AF37] font-bold mt-2 relative z-10">Saare steps mukammal! Certificate taiyar hai. 🎉</p>
          )}
        </div>

        {/* Vertical timeline — ek dafa mein ek hi step ka button (locked/unlocked) */}
        <div>
          {ms.map((m, idx) => {
            const step = JOURNEY_STEPS[idx] || { title: m.step, subtitle: '', icon: FaMosque, points: [], dua: null };
            const StepIcon = step.icon;
            const isDone = m.isCompleted;
            const isActive = idx === activeIdx;
            const isLocked = !isDone && !isActive;

            return (
              <div key={idx} className="relative flex gap-3.5 pb-5 last:pb-0">
                {/* connector line */}
                {idx < ms.length - 1 && (
                  <div className={`absolute left-[19px] top-11 bottom-0 w-0.5 rounded ${isDone ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                )}

                {/* node */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-sm transition-all ${
                  isDone ? 'bg-green-500 text-white border-green-500' :
                  isActive ? 'bg-[#D4AF37] text-white border-[#D4AF37] ring-4 ring-[#D4AF37]/25' :
                  'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {isDone ? <FaCheck className="text-sm" /> : isActive ? <StepIcon className="text-sm" /> : <FaLock className="text-xs" />}
                </div>

                {/* card */}
                <div className={`flex-1 rounded-xl border p-4 transition-all ${
                  isDone ? 'bg-green-50/50 border-green-200' :
                  isActive ? 'bg-white border-2 border-[#D4AF37]/60 shadow-md' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isDone ? 'bg-green-100 text-green-700 border-green-200' :
                          isActive ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-400 border-gray-200'
                        }`}>
                          Step {idx + 1} of {ms.length}
                        </span>
                        <span className="text-xs text-gray-400 font-bold" dir="rtl">{step.arabic}</span>
                      </div>
                      <h4 className={`font-extrabold mt-1 ${isDone ? 'text-green-700 line-through' : isActive ? 'text-gray-900 text-lg' : 'text-gray-500'}`}>
                        {step.title}
                      </h4>
                      {step.subtitle && <p className={`text-xs mt-0.5 ${isActive ? 'text-[#B8860B] font-bold' : 'text-gray-400'}`}>{step.subtitle}</p>}
                    </div>

                    {/* ACTION — sirf ACTIVE step par button */}
                    {isActive && (
                      <button
                        onClick={() => openProofModal(order, idx, `Step ${idx + 1}: ${step.title} — ${step.subtitle}`)}
                        className="bg-gradient-to-r from-[#0F3D14] to-[#1B5E20] text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:shadow-lg transition-all flex items-center gap-2 flex-shrink-0 self-start sm:self-center shadow"
                      >
                        <FaCheckCircle /> Complete Step + Proof
                      </button>
                    )}
                    {isDone && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0 self-start">DONE ✓</span>}
                    {isLocked && (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 self-start">
                        <FaLock className="text-[9px]" /> Locked
                      </span>
                    )}
                  </div>

                  {/* Details: active step par full guide, done par proof badges, locked par hint */}
                  {isActive && (
                    <div className="mt-3">
                      <ul className="space-y-1.5">
                        {(step.points || []).map((pt, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#0F3D14]/10 text-[#0F3D14] flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                            {pt}
                          </li>
                        ))}
                      </ul>
                      {step.dua && (
                        <div className="mt-3 bg-[#0F3D14] rounded-xl p-3.5 text-white">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-1.5 flex items-center gap-1.5"><FaPrayingHands /> Dua of this step</p>
                          <p className="text-lg leading-loose text-right" dir="rtl" style={{ fontFamily: "'Amiri','Traditional Arabic','Scheherazade New',serif" }}>{step.dua.arabic}</p>
                          <p className="text-[11px] italic text-[#D4AF37] mt-2">{step.dua.translit}</p>
                          <p className="text-[11px] text-white/70 mt-1">{step.dua.meaning}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {isDone && (
                    <div className="mt-2.5 space-y-1">
                      {m.proofUrl && (
                        <a href={m.proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <FaVideo /> View Proof <FaExternalLinkAlt className="text-[9px]" />
                        </a>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {m.proofLocation && (
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                            <FaMapMarkerAlt /> GPS ({m.proofLocation.lat}, {m.proofLocation.lng})
                          </span>
                        )}
                        {m.proofOcr?.suggestion === 'verified' && (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                            <FaRobot /> AI Verified (score {m.proofOcr.score})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {isLocked && (
                    <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1.5">
                      <FaLock className="text-[9px]" /> Yeh step tab khulega jab pichla step proof ke sath complete ho jaye.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 100% banner — certificate info */}
        {prog.pct === 100 && (
          <div className="mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 flex items-center gap-3 text-white">
            <FaAward className="text-3xl" />
            <div>
              <p className="font-extrabold">Umrah Mubarak! Journey Complete! 🎉</p>
              <p className="text-xs opacity-90">Aapka Certificate auto-generate ho gaya — History tab mein bhi mil jayega.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 font-outfit pb-20 md:pb-0">

      {/* ================= HEADER (Main-site branding) ================= */}
      <header className="bg-[#0F3D14]/95 backdrop-blur border-b border-[#D4AF37]/25 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <KaabaIcon className="w-9 h-9 text-[#D4AF37]" />
            <div className="leading-tight">
              <h1 className="text-lg font-bold tracking-wide hidden sm:block">Ibadah<span className="text-[#D4AF37]">Connect</span></h1>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37]/85 hidden sm:block font-semibold">Performer Portal</p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md hidden md:block">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <button onClick={() => fetchTasks()} title="Refresh" className="text-lg hover:bg-white/10 p-2 rounded-lg">
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>

            {/* ═══ v4 NOTIFICATION BELL (fully working) ═══ */}
            <div className="relative z-50">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                title="Notifications"
                className="relative text-lg hover:bg-white/10 p-2 rounded-lg"
              >
                <FaBell className={bellBounce ? 'animate-bounce' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full border-2 border-[#0F3D14] text-[10px] flex items-center justify-center font-bold px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-[330px] md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden text-gray-800">
                    <div className="p-3 bg-[#0F3D14] text-white flex justify-between items-center">
                      <p className="font-bold text-sm flex items-center gap-2"><FaBell className="text-[#D4AF37]" /> Notifications {unreadCount > 0 && <span className="text-[10px] bg-red-500 px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}</p>
                      <button onClick={markAllRead} className="text-[10px] bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg font-bold transition-colors">Mark all read</button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <p className="p-8 text-center text-sm text-gray-400">Abhi koi notification nahi. Naye tasks yahan nazar aayenge.</p>
                      ) : notifications.map(n => {
                        const st = NOTIF_STYLE[n.color] || NOTIF_STYLE.blue;
                        const unread = !readNotifs.includes(n.key);
                        return (
                          <button
                            key={n.key}
                            onClick={() => {
                              setReadNotifs(prev => (prev.includes(n.key) ? prev : [...prev, n.key]));
                              setShowNotifs(false);
                              if (n.tab) setActiveTab(n.tab);
                            }}
                            className={`w-full text-left p-3.5 flex gap-3 hover:bg-gray-50 transition-colors ${unread ? 'bg-blue-50/40' : 'bg-white'}`}
                          >
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${st.chip}`}>{n.icon}</span>
                            <span className="flex-1 min-w-0">
                              <span className="flex items-center justify-between gap-2">
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${st.badge}`}>{n.type}</span>
                                {unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                              </span>
                              <span className="block text-sm font-bold text-gray-800 mt-1 truncate">{n.title}</span>
                              <span className="block text-xs text-gray-500 leading-snug">{n.desc}</span>
                              <span className="block text-[10px] text-gray-400 mt-1">{timeAgo(n.time)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => setIsChatOpen(true)} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg hidden md:flex items-center gap-2">
              <FaCommentDots /> Live Chat
            </button>
            <button onClick={handleLogout} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2">
              <FaSignOutAlt /> <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 px-4">

        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=400&auto=format&fit=crop')" }}></div>
            <div className="p-4 flex flex-col items-center -mt-12">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white text-4xl border-4 border-white shadow-md font-bold">
                  {user?.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900 mt-3 text-center">{user?.firstName} {user?.lastName}</h2>
              {user?.isVerified !== undefined && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  {user.isVerified ? <><FaUserCheck className="text-green-500" /> Verified Performer</> : 'Verification pending'}
                </p>
              )}

              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-2 ${isBusy ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                {isBusy ? 'Busy with Task' : 'Available for Tasks'}
              </div>
            </div>

            <nav className="p-4 border-t border-gray-100 space-y-1 mt-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon} {item.label}
                  {item.id === 'tasks' && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                  {item.id === 'guide' && (
                    <span className="ml-auto text-[9px] font-bold text-[#B8860B] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => navigate('/performer-rules')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm text-purple-600 hover:bg-purple-50 border border-purple-100 transition-colors"
              >
                <FaScroll /> Rules & Regulations
              </button>
            </nav>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="lg:col-span-6 space-y-6">

          {activeTab === 'tasks' && (
            <>
              {/* Welcome Banner */}
              <div className="relative rounded-xl overflow-hidden h-32 flex items-center p-6 bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] shadow-md">
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold text-white">Assalamu Alaikum, {user?.firstName}!</h2>
                  <p className="text-white/80 text-sm mt-1">
                    {myActive ? (isRitualOrder(myActive) ? 'Your Umrah Journey is in progress — ek waqt mein ek step complete karein.' : 'Your task is in progress. Complete milestones with proof.') : myAssigned ? 'Admin ne aapko task assign kiya hai — Start Task dabayein.' : 'You are available. Check new requests below.'}
                  </p>
                </div>
                <FaPrayingHands className="absolute right-4 bottom-2 text-white/10 text-8xl" />
              </div>

              {/* DAILY LIMIT BANNER (aaj 1 task ho chuka hai) */}
              {acceptedToday && !isBusy && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <FaHourglassHalf className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-amber-700">
                    Daily limit reached — you can accept only 1 task per day. Come back tomorrow for new requests.
                  </p>
                </div>
              )}

              {/* ===== 1. ASSIGNED TASK (Purple Card + Start Task) ===== */}
              {myAssigned && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-300 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaTasks /> New Task Assigned by Admin</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">Assigned</span>
                  </div>
                  <div className="p-5">
                    <h4 className="text-xl font-extrabold text-gray-900">{myAssigned.serviceType} for {myAssigned.recipientName}</h4>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <FaUserTag /> Sponsor: {myAssigned.sponsor?.firstName} {myAssigned.sponsor?.lastName}
                      {myAssigned.recipientRelation && myAssigned.recipientRelation !== 'N/A' && <span>• Relation: {myAssigned.recipientRelation}</span>}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Your Earning (85%)</p>
                        {isDonation(myAssigned) ? (
                          <p className="text-sm font-extrabold text-purple-700 mt-1 leading-snug">{PRICE_HIDDEN}</p>
                        ) : (
                          <p className="text-lg font-extrabold text-purple-700">PKR {Math.round((myAssigned.price || 0) * 0.85).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Milestones</p>
                        <p className="text-lg font-extrabold text-gray-700">{(myAssigned.milestones || []).length} Steps</p>
                      </div>
                    </div>

                    {myAssigned.reason && myAssigned.reason !== 'N/A' && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Reason for Ibadah</p>
                        <p className="text-sm text-gray-700 italic">"{myAssigned.reason}"</p>
                      </div>
                    )}
                    {myAssigned.notes && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Special Instructions / Dua</p>
                        <p className="text-sm text-gray-700 italic">"{myAssigned.notes}"</p>
                      </div>
                    )}

                    <button
                      onClick={() => handleStartTask(myAssigned._id)}
                      className="mt-5 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold py-3.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
                    >
                      <FaPlay /> Start Task — Umrah Journey Khul Jayegi
                    </button>
                  </div>
                </div>
              )}

              {/* ===== 2. ACTIVE TASK (In Progress — Umrah Journey ya Generic Milestones) ===== */}
              {myActive && (
                <div className="bg-white rounded-xl shadow-sm border-2 border-green-200">
                  <div className="p-4 border-b border-gray-100 bg-green-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-green-700 flex items-center gap-2"><FaMosque /> Your Active Task</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{myActive.serviceType} for {myActive.recipientName} • Sponsor: {myActive.sponsor?.firstName} {myActive.sponsor?.lastName}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1"><FaHourglassHalf /> In Progress</span>
                  </div>
                  <div className="p-5">
                    {isRitualOrder(myActive) ? <UmrahJourney order={myActive} /> : <MilestoneList order={myActive} />}
                  </div>
                </div>
              )}

              {/* ===== 3. NEW REQUESTS (Pending) ===== */}
              {!isBusy && newRequests.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border border-red-200">
                  <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <FaBell /> New Task Requests ({newRequests.length})
                    </h3>
                    {acceptedToday && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">Daily Limit Reached</span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {newRequests
                      .filter(o => !searchQuery || `${o.serviceType} ${o.recipientName} ${o.sponsor?.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(order => (
                      <div key={order._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-red-50/40 transition-colors">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-lg font-bold text-gray-900">{order.serviceType}</h4>
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> NEW
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 flex items-center gap-2"><FaUserTag /> Recipient: {order.recipientName} ({order.recipientRelation || 'N/A'})</p>
                          <p className="text-sm text-gray-500">Sponsor: {order.sponsor?.firstName} {order.sponsor?.lastName}</p>
                          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 pt-0.5">
                            <FaClock className="text-gray-400" /> Requested: {timeAgo(order.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartTask(order._id)}
                          disabled={acceptedToday}
                          title={acceptedToday ? 'Daily limit reached — 1 task per day' : 'Accept this task'}
                          className={`font-bold px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-sm flex-shrink-0 ${
                            acceptedToday
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90 hover:shadow-md'
                          }`}
                        >
                          <FaCheck /> {acceptedToday ? 'Daily Limit Reached' : 'Accept Task'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isBusy && newRequests.filter(o => !searchQuery || `${o.serviceType} ${o.recipientName}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FaTasks className="text-5xl text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No tasks at the moment. Admin assignment ka wait karein.</p>
                 </div>
              )}
            </>
          )}

          {/* ================= HAJJ & UMRAH GUIDE TAB (v5) ================= */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Guide banner */}
              <div className="bg-gradient-to-r from-[#0F3D14] to-[#1B5E20] rounded-xl p-6 text-white relative overflow-hidden">
                <KaabaIcon className="absolute right-4 bottom-2 w-24 h-24 text-white/10" />
                <h2 className="text-2xl font-extrabold flex items-center gap-2 relative z-10"><FaBookOpen className="text-[#D4AF37]" /> Hajj &amp; Umrah Guide</h2>
                <p className="text-white/80 text-sm mt-1.5 max-w-2xl relative z-10">
                  Your complete guide to performing Hajj and Umrah — learn the key rituals, requirements, and preparations here.
                  Yehi steps aapke active task ke Umrah Journey milestones mein bhi hain.
                </p>
              </div>

              {/* Category cards (hajjumrahplanner structure) */}
              <div>
                <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wider mb-3">Guide Categories</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GUIDE_CATEGORIES.map((c, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-3.5 hover:shadow-md hover:border-[#D4AF37]/50 transition-all">
                      <div className="flex justify-between items-start">
                        <span className={`w-9 h-9 rounded-lg border flex items-center justify-center ${c.chip}`}><c.icon /></span>
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">{c.articles} Articles</span>
                      </div>
                      <h4 className="font-bold text-sm mt-2.5 text-gray-800">{c.name}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rites of Umrah — accordion */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/60 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FaKaaba className="text-[#0F3D14]" /> Rites of Umrah — Step by Step</h3>
                  <span className="text-[10px] font-bold text-gray-400 hidden sm:block">{GUIDE_SECTIONS.length} Sections</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {GUIDE_SECTIONS.map((s, i) => {
                    const open = openGuide === i;
                    const SecIcon = s.icon;
                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => setOpenGuide(open ? -1 : i)}
                          className={`w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${open ? 'bg-[#0F3D14]/[0.03]' : ''}`}
                        >
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${open ? 'bg-[#0F3D14] text-[#D4AF37]' : 'bg-gray-100 text-gray-500'}`}>
                            <SecIcon />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-gray-800">{i + 1}. {s.title}</span>
                              <span className="text-xs text-gray-400 font-bold" dir="rtl">{s.arabic}</span>
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{s.read}</span>
                            </span>
                          </span>
                          <FaChevronDown className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
                        </button>

                        {open && (
                          <div className="px-4 pb-5 pt-1">
                            <p className="text-sm text-gray-600 leading-relaxed">{s.intro}</p>

                            <ul className="mt-3 space-y-2">
                              {s.points.map((pt, j) => (
                                <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0 text-xs" />
                                  <span className="leading-relaxed">{pt}</span>
                                </li>
                              ))}
                            </ul>

                            {s.dua && (
                              <div className="mt-4 bg-[#0F3D14] rounded-xl p-4 text-white">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-2 flex items-center gap-1.5"><FaPrayingHands /> Dua</p>
                                <p className="text-xl leading-loose text-right" dir="rtl" style={{ fontFamily: "'Amiri','Traditional Arabic','Scheherazade New',serif" }}>{s.dua.arabic}</p>
                                <p className="text-xs italic text-[#D4AF37] mt-2">{s.dua.translit}</p>
                                <p className="text-xs text-white/70 mt-1">{s.dua.meaning}</p>
                              </div>
                            )}

                            {s.penalties && (
                              <div className="mt-4 rounded-xl border border-red-100 overflow-hidden">
                                <div className="bg-red-50 px-3.5 py-2 flex items-center gap-2">
                                  <FaExclamationTriangle className="text-red-500 text-xs" />
                                  <p className="text-[11px] font-extrabold text-red-600 uppercase tracking-wider">Violations &amp; Penalties (Kaffarah)</p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {s.penalties.map((p, j) => (
                                    <div key={j} className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs hover:bg-gray-50">
                                      <span className="text-gray-700 font-semibold">{p.rule}</span>
                                      <span className="text-red-600 font-bold sm:text-right flex-shrink-0">{p.penalty}</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="px-3.5 py-2.5 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100 leading-relaxed">
                                  <FaTint className="inline mr-1" /> Dum = Makkah/Haram ke andar badana (goat) qurbani • Sadaqah = 1 miskeen ko do waqt ka khana. Apne case ke mutabiq hukm imam/aalim se confirm karein.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="px-4 py-3 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100 leading-relaxed">
                  Yeh guide standard manasik-e-Umrah/Hajj ke mutabiq summary hai (structure: Hajj &amp; Umrah Planner style). IbadahConnect — har step ka proof GPS + AI verification ke sath record hota hai.
                </p>
              </div>
            </div>
          )}

          {/* ================= HISTORY TAB ================= */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">My Task History</h3>
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-600">{myCompleted.length} Completed</span>
              </div>
              <div className="divide-y divide-gray-100">
                {myCompleted.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">No completed tasks yet. Apna pehla task complete karein!</div>
                ) : myCompleted.map(order => {
                  const prog = milestoneProgress(order);
                  return (
                    <div key={order._id} className="p-4 flex justify-between items-center hover:bg-gray-50 gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900">{order.serviceType} for {order.recipientName}</h4>
                        <p className="text-xs text-gray-500">Completed: {new Date(order.updatedAt).toLocaleDateString()} • {prog.done}/{prog.total} milestones verified</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isDonation(order) ? (
                          <span className="text-purple-600 font-bold text-xs block">{PRICE_HIDDEN}</span>
                        ) : (
                          <span className="text-green-600 font-bold text-sm block">PKR {Math.round((order.price || 0) * 0.85).toLocaleString()}</span>
                        )}
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">PAID</span>
                        {/* v5: Umrah/Hajj orders par re-viewable certificate */}
                        {isRitualOrder(order) && (
                          <button
                            onClick={() => setCertificate({ order, issuedAt: order.updatedAt })}
                            className="mt-1.5 text-[10px] font-extrabold text-[#B8860B] bg-amber-50 border border-amber-200 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-amber-100 transition-colors ml-auto"
                          >
                            <FaCertificate /> Umrah Certificate
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= FEEDBACKS TAB ================= */}
          {activeTab === 'feedbacks' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sponsor Feedbacks</h3>
              {myCompleted.length === 0 ? (
                <p className="text-gray-400 text-sm">Task complete hone par sponsor feedback yahan show hoga.</p>
              ) : (
                <div className="space-y-4">
                  {myCompleted.slice(0, 4).map(order => (
                    <div key={order._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{order.sponsor?.firstName} {order.sponsor?.lastName}</h4>
                        <div className="flex text-yellow-400 text-sm">{[...Array(5)].map((_, i) => <FaStar key={i} />)}</div>
                      </div>
                      <p className="text-sm text-gray-600">Task "{order.serviceType} for {order.recipientName}" — proof videos se tasalli mili. JazakAllah Khair!</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= EARNINGS TAB (Real Data) ================= */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] p-6 rounded-xl shadow-sm text-white">
                <p className="text-sm opacity-80">Total Lifetime Earnings (85% share)</p>
                <h3 className="text-4xl font-extrabold mt-2">PKR {totalEarnings.toLocaleString()}</h3>
                {myActive && (
                  <p className="text-sm mt-3 bg-white/10 inline-block px-3 py-1.5 rounded-lg">
                    {isDonation(myActive) ? (
                      <>In Progress: <span className="font-bold text-accent">🔒 Price Hidden</span> (Rules &amp; Regulations apply)</>
                    ) : (
                      <>In Progress: <span className="font-bold text-accent">PKR {pendingEarnings.toLocaleString()}</span> (complete karne par milega)</>
                    )}
                  </p>
                )}
                <button className="mt-4 bg-accent text-dark font-bold px-6 py-2 rounded-lg text-sm hover:bg-yellow-500">Withdraw Funds</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Transaction History (Completed Tasks)</h3>
                {myCompleted.length === 0 ? (
                  <p className="text-gray-400 text-sm">Abhi koi transaction nahi. Task complete karein.</p>
                ) : (
                  <div className="space-y-3">
                    {myCompleted.map(o => (
                      <div key={o._id} className="flex justify-between text-sm border-b pb-2">
                        <span className="text-gray-600">{o.serviceType} — {o.recipientName}</span>
                        {isDonation(o) ? (
                          <span className="font-bold text-purple-600">🔒 Price Hidden</span>
                        ) : (
                          <span className="font-bold text-green-600">+ PKR {Math.round((o.price || 0) * 0.85).toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SETTINGS TAB ================= */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Profile Settings</h3>
              <div className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">First Name</label><input type="text" defaultValue={user?.firstName} className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input type="email" defaultValue={user?.email} className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" /></div>
                <button onClick={() => toast.success('Profile saved!')} className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary/90">Save Changes</button>
              </div>
            </div>
          )}
        </main>

        {/* ================= RIGHT SIDEBAR (Real Stats) ================= */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-20">
            <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Performer Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-gray-500">Total Earnings</span><span className="font-bold text-green-600">PKR {totalEarnings.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Donation Tasks</span><span className="font-bold text-purple-600 text-xs">🔒 Price Hidden</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Tasks Completed</span><span className="font-bold text-gray-800">{myCompleted.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Active Task</span><span className="font-bold text-blue-600">{activeTask ? activeTask.serviceType : 'None'}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Available Status</span><span className={`font-bold ${isBusy ? 'text-red-500' : 'text-green-600'}`}>{isBusy ? 'Busy' : 'Available'}</span></div>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <FaLock className="inline mr-1" />Umrah Journey ke har step ke sath proof zaroori hai. 5/5 steps complete hone par order "Completed" ho jata hai aur aapka <b>Certificate auto-generate</b> ho jata hai.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ================= PROOF MODAL (Professional) ================= */}
      {proofModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !proofSaving && setProofModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><FaVideo /> Complete Step</h3>
              <button onClick={() => setProofModal(null)} className="hover:bg-white/20 p-1 rounded-full" disabled={proofSaving}><FaTimesCircle /></button>
            </div>
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Umrah Journey — Step</p>
                <p className="font-bold text-gray-900">{proofModal.step}</p>
              </div>
              {/* AUTOMATIC LOCATION STATUS (auto-capture chal raha hai) */}
              <div className={`rounded-xl p-3 mb-4 border ${
                locStatus === 'captured' ? 'bg-green-50 border-green-200' :
                locStatus === 'capturing' ? 'bg-blue-50 border-blue-200' :
                locStatus === 'error' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                  <FaMapMarkerAlt className="text-primary" /> Automatic Location
                  {locStatus === 'capturing' && <span className="text-blue-600 normal-case">— capture ho rahi hai...</span>}
                </p>
                {locStatus === 'captured' && proofLocation && (
                  <p className="text-xs text-green-700 font-bold mt-1">
                    ✅ Location Verified: {proofLocation.lat}, {proofLocation.lng}
                  </p>
                )}
                {locStatus === 'capturing' && (
                  <p className="text-xs text-blue-600 mt-1">Browser se GPS coordinates liye ja rahe hain...</p>
                )}
                {locStatus === 'error' && (
                  <p className="text-xs text-amber-700 mt-1">Location nahi mil saki (permission band ya http page). Proof link phir bhi submit ho jayega.</p>
                )}
              </div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Video / Photo Proof Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                autoFocus
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitProof()}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                <FaLink className="mt-0.5 flex-shrink-0" />
                YouTube, Google Drive ya koi bhi proof link paste karein. Sponsor ko yeh link tracking page par nazar aayega.
              </p>

              {/* OCR PROOF VERIFICATION BOX (AI check) */}
              {proofUrl.trim() && looksLikeImage(proofUrl.trim()) && (
                <div className={`rounded-xl p-3 mt-3 border ${
                  ocrStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
                  ocrStatus === 'done' && ocrResult?.suggestion === 'verified' ? 'bg-green-50 border-green-200' :
                  ocrStatus === 'done' && ocrResult?.suggestion === 'weak-match' ? 'bg-amber-50 border-amber-200' :
                  ocrStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                    <FaRobot className="text-blue-600" /> AI Proof Verification (OCR)
                    {ocrStatus === 'checking' && <span className="text-blue-600 normal-case">— receipt scan ho rahi hai...</span>}
                  </p>

                  {ocrStatus === 'checking' && (
                    <p className="text-xs text-blue-600 mt-1">AI image par se text parh raha hai (3-10 seconds)...</p>
                  )}

                  {ocrStatus === 'done' && ocrResult && (
                    <div className="mt-1">
                      <p className={`text-xs font-bold ${
                        ocrResult.suggestion === 'verified' ? 'text-green-700' :
                        ocrResult.suggestion === 'weak-match' ? 'text-amber-700' : 'text-red-600'
                      }`}>
                        {ocrResult.suggestion === 'verified' && '✅ Verified — Receipt keywords mil gaye'}
                        {ocrResult.suggestion === 'weak-match' && '⚠️ Weak match — Admin review karega'}
                        {ocrResult.suggestion === 'manual-review' && '✗ Koi receipt keyword nahi mila — Admin review karega'}
                      </p>
                      {ocrResult.matched?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ocrResult.matched.map((w, i) => (
                            <span key={i} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">✓ {w}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5">Text readability: {ocrResult.confidence}% • Score: {ocrResult.score}</p>
                    </div>
                  )}

                  {ocrStatus === 'error' && (
                    <p className="text-xs text-red-600 mt-1">AI check fail hua — proof phir bhi submit ho sakta hai (Admin manually dekhega).</p>
                  )}

                  {(ocrStatus === 'done' || ocrStatus === 'error') && (
                    <button onClick={() => runOcrCheck(proofUrl.trim())} className="mt-2 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                      <FaSyncAlt /> Phir Se AI Check
                    </button>
                  )}
                </div>
              )}
              {proofUrl.trim() && !looksLikeImage(proofUrl.trim()) && (
                <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1.5">
                  <FaRobot className="mt-0.5 flex-shrink-0" />
                  AI OCR check sirf image (receipt/photo) links par chalta hai — video links Admin khud verify karte hain.
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setProofModal(null)} disabled={proofSaving} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">Cancel</button>
                <button onClick={submitProof} disabled={proofSaving} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 text-sm flex items-center justify-center gap-2">
                  {proofSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaCheckCircle />} Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ v5 AUTO-GENERATED CERTIFICATE MODAL ═══════════ */}
      {certificate && (
        <>
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #ic-certificate, #ic-certificate * { visibility: visible !important; }
              #ic-certificate {
                position: fixed !important; left: 0; top: 0; width: 100%;
                border-radius: 0 !important; box-shadow: none !important;
                -webkit-print-color-adjust: exact; print-color-adjust: exact;
              }
              .no-print { display: none !important; }
            }
          `}</style>
          <div className="fixed inset-0 bg-black/70 z-[70] overflow-y-auto p-4 flex items-start md:items-center justify-center no-print" onClick={() => setCertificate(null)}>
            <div className="w-full max-w-3xl my-4" onClick={e => e.stopPropagation()}>
              <div id="ic-certificate" className="bg-[#FFFBF0] rounded-2xl shadow-2xl overflow-hidden border-4 border-[#D4AF37]">
                <div className="border-[3px] border-[#0F3D14]/60 m-2.5 p-6 md:p-10 relative">
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-md"></div>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] rounded-tr-md"></div>
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] rounded-bl-md"></div>
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] rounded-br-md"></div>

                  {/* Header */}
                  <div className="text-center">
                    <p className="text-base text-[#0F3D14]/70" dir="rtl" style={{ fontFamily: "'Amiri','Traditional Arabic','Scheherazade New',serif" }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <KaabaIcon className="w-12 h-12 text-[#0F3D14] mx-auto mt-2" />
                    <p className="text-[10px] tracking-[0.35em] uppercase text-[#0F3D14]/60 mt-2 font-bold">IbadahConnect • Badal Ibadah Platform</p>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F3D14] mt-2" style={{ fontFamily: 'Georgia, serif' }}>Certificate of Completion</h2>
                    <div className="w-24 h-0.5 bg-[#D4AF37] mx-auto mt-3"></div>
                  </div>

                  {/* Body */}
                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-500 italic">This certificate is proudly presented to</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#1B5E20] mt-2 border-b-2 border-[#D4AF37] inline-block px-8 pb-1">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm md:text-[15px] text-gray-700 mt-4 leading-relaxed max-w-xl mx-auto">
                      for faithfully performing <b className="text-[#0F3D14]">{certificate.order?.serviceType || 'Umrah Badal'}</b>
                      {' '}on behalf of <b className="text-[#0F3D14]">{certificate.order?.recipientName || 'the Recipient'}</b>
                      {certificate.order?.sponsor && <> (Sponsor: {certificate.order.sponsor?.firstName} {certificate.order.sponsor?.lastName})</>},
                      completing all rites — <b>Ihram, Tawaf, Sa'i &amp; Halq/Taqsir</b> — with GPS-verified proofs at every milestone.
                    </p>
                    <p className="text-xs text-gray-500 mt-3 italic">"Allah ta'ala yeh Ibadah qabool farmaye — Ameen."</p>
                  </div>

                  {/* Footer: date / seal / signature */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-10">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date Issued</p>
                      <p className="text-sm font-extrabold text-[#0F3D14]">{new Date(certificate.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-2">Certificate No.</p>
                      <p className="text-sm font-extrabold text-[#0F3D14]">IC-{String(certificate.order?._id || '').slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-[#0F3D14] border-4 border-[#D4AF37] flex flex-col items-center justify-center shadow-md">
                        <KaabaIcon className="w-8 h-8 text-[#D4AF37]" />
                        <span className="text-[7px] font-bold tracking-widest text-white mt-0.5">VERIFIED</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-wider">Official Seal</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-lg italic text-[#0F3D14]" style={{ fontFamily: "'Brush Script MT','Segoe Script',cursive" }}>IbadahConnect</p>
                      <div className="w-36 border-t border-gray-400 mt-1"></div>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Director — IbadahConnect</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions (print mein hidden) */}
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={() => window.print()} className="bg-[#0F3D14] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#0F3D14]/90 flex items-center gap-2 shadow-lg">
                  <FaPrint /> Print / Save as PDF
                </button>
                <button onClick={() => setCertificate(null)} className="bg-white text-gray-600 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-100 border border-gray-200 flex items-center gap-2 shadow">
                  <FaTimesCircle /> Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= LIVE CHAT ================= */}
      {isChatOpen && (
        <div className="fixed bottom-0 right-0 m-4 w-full max-w-sm bg-white rounded-t-2xl shadow-2xl border border-gray-200 z-50 flex flex-col" style={{ height: '500px' }}>
          <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><h3 className="font-bold">Live Support / Admin</h3></div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><FaTimesCircle /></button>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.sender === 'Me' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'}`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2 bg-white rounded-b-2xl">
            <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:outline-none text-sm" />
            <button type="submit" className="bg-accent text-dark p-2.5 rounded-full hover:bg-yellow-500 transition-colors w-10 h-10 flex items-center justify-center"><FaPaperPlane className="text-sm" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformerDashboard;
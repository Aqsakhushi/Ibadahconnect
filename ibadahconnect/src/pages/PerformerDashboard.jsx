// ============================================================
// IbadahConnect - PerformerDashboard.jsx  (v8.1 - CLEAN NAME MENU)
// v8.1: the header name menu is stripped to what the user asked for —
//   NAME + PORTAL MENU (plus Rules and Log out). Removed from the menu:
//   the Busy toggle and the whole Profile Strength block (both now live
//   as proper cards in the Profile & Stats tab), the colored type/agency
//   chips and the orange request-count badge. Menu colors are neutral:
//   active item = forest-green text on gray-50, log out stays red.
//   The menu is w-72 with max-height + internal scroll, so it always
//   fits the screen at 100% zoom and scrolls easily instead of being
//   cut off. No endpoints touched, no layout changes anywhere else.
// v8.0: pairs this portal with the delivered backend/routes/orders-v2.js
//   (sponsor name guaranteed on every order response, real auto-assign,
//   race-safe claims). The approved v7.6 UI skeleton is untouched:
//   1) SPONSOR NAME: order.sponsorName (computed server-side by orders
//      v2) is the first source the sponsor resolver trusts; the populated
//      object and the legacy fallbacks stay as backup for older backends.
//      "Not yet assigned" is fixed at the source, so the console hint now
//      just points to the delivered orders-v2.js file.
//   2) AUTO-ASSIGN AWARENESS: new-task toasts / notifications are neutral
//      ("New task assigned") because orders v2 auto-assigns Pending
//      requests to available performers the moment they are booked; the
//      New Requests card explains this in one line, and the queue
//      empty-state copy matches the real assignment behaviour.
//   3) RACE-SAFE CLAIMS: when two performers tap Accept at the same
//      moment, the loser still gets the server's "just taken by another
//      performer" toast AND the list refreshes immediately, so the
//      claimed order vanishes from New Requests at once.
//   4) Copy fixes: booking notes come from the sponsor's form ("Note
//      from sponsor"), and the greeting no longer claims every task is
//      assigned by Admin. Gamification (points / levels / badges / streak
//      / payouts) ships unchanged.
// v7.6: rebuilt to match the approved Stitch picture 1:1 - header gets the
//   center search box ("Search tasks...", filters new requests) + refresh icon;
//   the Location pill becomes the mockup BANNER (toggle + text + Try again,
//   tapping the toggle still opens the separate full-page map); task card
//   title is serif with the gold underline; Sponsor gets VERIFIED SPONSOR
//   badge, Recipient gets BENEFICIARY badge; progress reads "N of M completed";
//   the RIGHT RAIL returns exactly as in the picture: Quick Actions (Start
//   Task, Upload Proof, Chat Admin, Read Guide) + How It Works (5 numbered
//   steps). Layout = 8/4 grid. The old inline Leaflet "Live Task Map" box is
//   FULLY removed (component, CDN loader, pins, CSS). Log out stays inside the
//   name menu (v7.4). Logo untouched. Endpoints untouched. Order.js untouched.
// v7.4: the header Log out button is REMOVED. Log out is now the last item
//   inside the performer name menu (red, sign-out icon) - header right side is
//   only: availability dot, Live chat, Notifications, performer name menu.
//   Indentation re-verified file-wide: 2 spaces, zero tabs, zero trailing spaces.
// v7.3: header trimmed to the approved mockup - logo left; right side only has
//   the availability dot, Live chat, Notifications and the performer name menu
//   (navigation lives inside it). The search box, the refresh icon and the
//   horizontal tab bar are removed - they were never part of the mockup.
//   Location stays as the small on/off button that opens the live map.
// v7.2: BOTH side rails are gone - the portal is one clean focused column.
//   The big Location card is replaced by a single small on/off pill button;
//   tapping it opens a SEPARATE full-page live map (OpenStreetMap embed) that
//   pins your exact GPS point - "You are here" - with a Refresh position
//   button. No new dependencies, no API key. Logo, theme, endpoints untouched.
// v7.1: the left profile sidebar is gone. The performer's name + avatar now sit
//   in the header right next to Log out; clicking it opens a dropdown with the
//   full profile (photo, Verified badge, performer type, Busy toggle, Profile
//   Strength). Navigation moved to a horizontal tab bar under the header.
//   Main column widened (8/4 split). Logo, theme and endpoints untouched.
// v7.0: restyled to the final approved HTML mockup - Plus Jakarta Sans UI text,
// Newsreader serif display headings ("Active task", Assigned by/on/at), forest
// green #0F4D38 + gold #C29845 palette, toggle-switch Location card, Assigned
// by/on/at metadata row, mockup task card (gold progress bar, attribute grid,
// gold-border reason quote, Start step 1 / Upload proof / Message admin),
// timeline-style steps, dark-green footer. Logo untouched. All endpoints same.
// What changed in v6.0 (same UI skeleton, same endpoints):
//   1) PACKAGE-SPECIFIC GUIDED STEPS: Sadaqah/Donation = 4 steps
//      (Niyyah message -> Procurement -> Distribution -> Report+Dua),
//      Umrah Badal = 10 authentic steps (Preparation, Miqat Niyyah +
//      Talbiyah, Journey, Entering Haram, Tawaf 7x, Maqam Ibrahim,
//      Zamzam, Sa'i 7x, Halq/Taqsir, Final Dua), Hajj Badal = its own
//      10 steps (Ihram at Miqat, Mina, Arafah, Muzdalifah, Rami 7x,
//      Qurbani, Tawaf al-Ziyarah 7x, Sa'i 7x, Halq, Tawaf al-Wada +
//      Final Dua). Every step has a full description + reference pic.
//   2) NIYYAH AS A MESSAGE: the performer types the niyyah / talbiyah /
//      report as a message (pre-filled template with beneficiary +
//      mother's name fields). The message travels to the sponsor's
//      tracking page through proofLocation.address (Order.js untouched).
//   3) PROCUREMENT PROOF: multi-photo upload + receipt photo + GPS ON,
//      all shown to the sponsor.
//   4) AI REFERENCE CHECK: every uploaded photo is checked against the
//      step's reference image (POST /proof/ai-match -> matchPercent).
//      60%+ = pass, below 60% = submit blocked (retake the photo).
//      If the AI route is offline the proof degrades to manual review,
//      the flow never bricks.
//   5) SEQUENTIAL LOCK: step N+1 stays locked until step N completes;
//      a completed step is locked permanently. Guided steps are mapped
//      onto the existing DB milestone template (Order.js untouched):
//      the LAST step of each group submits the milestone via
//      PUT /orders/update-milestone/:id, so the sponsor tracking page
//      keeps working exactly as before.
//   6) COUNTERS: Tawaf / Tawaf al-Ziyarah (7 circuits), Sa'i (7 rounds)
//      and Rami (7 pebbles) each get a per-circuit tap counter. The
//      Complete button stays disabled until 7/7.
//   7) Guided steps stay pinned to their Makkah sites in the step descriptions.
// No new dependencies. React 19 + Vite safe. Order.js untouched.
// ============================================================
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { logout } from '../utils/auth';
import toast from 'react-hot-toast';
import {
  FaTasks, FaSignOutAlt, FaUserCircle, FaHistory, FaStar, FaRegComment, FaCog, FaWallet,
  FaCommentDots, FaSearch, FaBell, FaPaperPlane, FaTimesCircle, FaCheck, FaUserTag,
  FaMoneyBillWave, FaPrayingHands, FaPlay, FaTrophy, FaSyncAlt, FaVideo, FaMosque,
  FaCheckCircle, FaHourglassHalf, FaLock, FaExternalLinkAlt, FaUserCheck, FaScroll, FaMapMarkerAlt, FaRobot,
  FaCamera, FaImage, FaKey, FaUpload, FaUsers, FaHandshake, FaBuilding,
  FaKaaba, FaShoePrints, FaCut, FaCampground, FaBullseye, FaMountain, FaMoon,
  FaHandHoldingHeart, FaGift, FaQuran,
  FaIdCard, FaExclamationTriangle, FaMedal, FaChartBar, FaUniversity, FaMobileAlt,
  FaCloudSun, FaBolt, FaFire, FaInfoCircle, FaClock, FaCalendarAlt, FaCrown, FaCheckDouble, FaArrowUp, FaMoneyCheckAlt,
  FaEnvelopeOpenText, FaShoppingBasket, FaRoute, FaDoorOpen, FaTint, FaFileAlt, FaChevronDown, FaArrowLeft
} from 'react-icons/fa';

// Reference pictures per guided step (web-hosted, embeddable URLs)
const STEP_IMGS = {
  ihram: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/240f083a434d.jpg',
  tawaf: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0a7489f7dc01.jpg',
  sai: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/38d3b4daf6fd.jpg',
  halq: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b3656831bbb6.jpg',
  dua: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e68628d0fa1c.jpg',
  sadaqah: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/806eb39eccf3.png',
  delivery: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/02468fa8d746.jpg',
  miqat: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6fe2647d2e24.jpg',
  journey: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1df4a4f0e270.jpeg',
  enter: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2b2d966e37ad.jpg',
  maqam: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/55f88699a3f9.jpg',
  zamzam: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d08b8c99fa4f.jpg',
  mina: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b4bcb5a87688.jpg',
  arafah: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/eed5f5990c9f.jpg',
  muzdalifah: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/10422a6c2890.jpg',
  rami: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a12075381de3.jpg',
  qurbani: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/577f76cfaf68.jpg',
  procure: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/39e931efa107.jpg',
  distrib: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/953cc56531a5.jpg',
};

const AI_MATCH_MIN = 60; // AI reference-match threshold: 60%+ locks the step

// ============================================================
// PACKAGE-SPECIFIC GUIDED STEPS (v6.0)
// The DB milestone template (backend routes/orders.js) is never changed.
// Each guided step carries msIdx = the DB milestone slot it belongs to,
// and closes = true marks the LAST step of that group: completing it
// submits the milestone proof through PUT /orders/update-milestone/:id.
// ============================================================
const FLOW_STEPS = {
  // ---- FLOW 1: Sadaqah / Donation (4 guided steps on 2 DB milestones) ----
  donation: [
    {
      key: 'niyyah', title: 'Niyyah (Intention)', ar: 'النية',
      desc: 'The niyyah cannot be shown on camera, so you type it as a message instead. The message is delivered to the sponsor and shown on their tracking page. Use the format: "I distribute this sadaqah on behalf of [Name], for the soul of [Name]".',
      points: [
        'The niyyah is made with a sincere heart before anything is purchased or handed over.',
        'Only halal, owned wealth is used — no doubtful or borrowed money.',
        'The message you type below is shown to the sponsor on the tracking page.'
      ],
      icon: FaEnvelopeOpenText, img: STEP_IMGS.sadaqah,
      need: { msg: true },
      msgFields: [
        { key: 'behalf', label: 'On behalf of (sponsor / donor name)', ph: 'e.g. Affan' },
        { key: 'soul', label: 'For the soul of (name)', ph: 'e.g. Ahmed Ali' }
      ],
      msgTpl: (f) => `I distribute this sadaqah on behalf of ${f.behalf || '[Name]'}, for the soul of ${f.soul || '[Name]'}. May Allah accept it and grant the best reward. Ameen.`,
      msIdx: 0, closes: false
    },
    {
      key: 'procurement', title: 'Procurement (Buy the Items)', ar: 'الشراء',
      desc: 'Purchase the package items (new clothes, toys, dates, Eid package — per the package list). Upload clear photos of the items plus the purchase receipt, and keep your location ON — both are shown to the sponsor.',
      points: [
        'Buy new, quality items — sadaqah should be from the good things you would choose for yourself.',
        'Photograph every item plus the receipt — the sponsor sees them on the tracking page.',
        'GPS is attached automatically so the sponsor can verify the purchase place.'
      ],
      icon: FaShoppingBasket, img: STEP_IMGS.procure,
      need: { photos: 2, receipt: true, gps: true },
      msIdx: 0, closes: true
    },
    {
      key: 'distribution', title: 'Distribution (Handover)', ar: 'التوزيع',
      desc: 'Hand over the items to the verified family / beneficiaries and record a short video of the handover with your GPS location ON. For Eid packages, complete this before Eid.',
      points: [
        'Give with the right hand and never remind the receiver of the favour.',
        'Respectful video only — never photograph faces without consent.',
        'The GPS-verified video is the strongest proof for the sponsor.'
      ],
      icon: FaHandHoldingHeart, img: STEP_IMGS.distrib,
      need: { video: true, gps: true },
      msIdx: 1, closes: false
    },
    {
      key: 'report', title: 'Report + Dua', ar: 'التقرير والدعاء',
      desc: 'Write a short completion report as a message (what was delivered, where, how many people benefited) and upload one closing photo. End with a dua for the beneficiary — completing this step completes the task.',
      points: [
        'Report the facts: items delivered, the area, and the number of beneficiaries.',
        'Make a dua for the beneficiary and their family in your report.',
        'Completing this step sends the final milestone proof to the sponsor.'
      ],
      icon: FaFileAlt, img: STEP_IMGS.dua,
      need: { msg: true, photos: 1 },
      msgFields: [
        { key: 'delivered', label: 'What was delivered', ph: 'e.g. Eid Gift Bundle (clothes, toys, dates)' },
        { key: 'place', label: 'Where was it delivered', ph: 'e.g. Company Bagh, Lahore' },
        { key: 'count', label: 'How many people benefited', ph: 'e.g. A family of 6' }
      ],
      msgTpl: (f) => `Report: Delivered ${f.delivered || 'the package items'} to the verified beneficiaries${f.place ? ` in ${f.place}` : ''}${f.count ? ` (${f.count})` : ''}. We made a dua for the beneficiary and their family. May Allah accept this sadaqah. Ameen.`,
      msIdx: 1, closes: true
    }
  ],
  // ---- FLOW 2: Umrah Badal (10 guided steps on 5 DB milestones) ----
  umrah: [
    {
      key: 'prep', title: 'Preparation (Before Miqat)', ar: 'الاستعداد',
      desc: 'Take ghusl (sunnah, not a requirement). Apply perfume BEFORE wearing the ihram — after the niyyah perfume becomes not allowed. Trim nails and remove armpit hair (sunnah). Men wear 2 white unstitched sheets; women wear normal hijab clothing (Hanafi: no naqab/gloves). Upload a photo of your ihram preparation.',
      points: [
        'Ghusl is sunnah, not a requirement.',
        'Perfume goes BEFORE the ihram — once the niyyah is made it is not allowed.',
        'Men: 2 white unstitched sheets. Women: normal hijab clothing (Hanafi: no naqab/gloves).'
      ],
      icon: FaMosque, img: STEP_IMGS.ihram,
      need: { photos: 1 },
      msIdx: 0, closes: false
    },
    {
      key: 'miqat', title: 'Miqat — Niyyah + Talbiyah', ar: 'الميقات',
      desc: 'For Makkah residents the miqat is Masjid Aisha (Tani\'im), about 10 minutes drive. Pray 2 rak\'at sunnah (if the time is not makruh), then raise the Talbiyah — it is the external form of the niyyah: "Labbayk Allahumma labbayk... \'umratan \'an [Beneficiary] ibn/bint [Mother\'s Name]". The mother\'s name is part of the talbiyah because every person will be called by their mother\'s name on Qiyamat (Abu Dawud). Red line: the niyyah is 100% for the beneficiary — mixing in your own niyyah makes the badal fasid. After the niyyah the ihram restrictions are active: no cutting hair/nails, no perfume, no hunting. The talbiyah message below is sent to the sponsor.',
      points: [
        'Makkah residents enter ihram at Masjid Aisha (Tani\'im).',
        'Every person will be called by their mother\'s name on Qiyamat (Abu Dawud) — that is why the talbiyah includes it.',
        'Red line: the niyyah is 100% for the beneficiary — mixing your own niyyah makes the badal fasid.'
      ],
      icon: FaMosque, img: STEP_IMGS.miqat,
      need: { msg: true, photos: 1, gps: true },
      msgFields: [
        { key: 'beneficiary', label: 'Beneficiary name', ph: 'e.g. Ahmed Ali' },
        { key: 'rel', label: 'Relation word', type: 'select', options: [{ v: 'ibn', l: 'ibn (son)' }, { v: 'bint', l: 'bint (daughter)' }] },
        { key: 'mother', label: "Beneficiary's mother's name", ph: 'e.g. Fatima' }
      ],
      msgTpl: (f) => `Labbayk Allahumma labbayk, labbayka laa shareeka laka labbayk. Innal hamda wan ni'mata laka wal mulk, laa shareeka lak. 'umratan 'an ${f.beneficiary || '[Beneficiary]'} ${f.rel || 'ibn/bint'} ${f.mother || "[Mother's Name]"}.`,
      msIdx: 0, closes: true
    },
    {
      key: 'journey', title: 'Journey Towards Haram', ar: 'السفر',
      desc: 'Recite the Talbiyah throughout the journey — men with a raised voice, women softly. Keep doing dhikr and make dua for the beneficiary along the way. Upload a photo from the journey.',
      points: [
        'Men recite the Talbiyah aloud; women recite it softly.',
        'Fill the journey with dhikr and dua for the beneficiary.',
        'Ihram restrictions stay active during the travel.'
      ],
      icon: FaRoute, img: STEP_IMGS.journey,
      need: { photos: 1 },
      msIdx: 1, closes: false
    },
    {
      key: 'enter', title: 'Entering Masjid al-Haram', ar: 'دخول الحرم',
      desc: 'Enter with the right foot first and recite: "Allahumma iftah li abwaba rahmatik" (O Allah, open the doors of Your mercy for me). Upload a photo from inside the Haram — your GPS location is attached automatically.',
      points: [
        'Right foot enters first, with the dua of entering.',
        'Keep making dua for the beneficiary from the moment you see the Haram.',
        'GPS verifies the visit place for the sponsor.'
      ],
      icon: FaDoorOpen, img: STEP_IMGS.enter,
      need: { photos: 1, gps: true },
      msIdx: 1, closes: false
    },
    {
      key: 'tawaf', title: 'Tawaf — 7 Circuits', ar: 'الطواف',
      desc: 'Wudu is a SHART for tawaf — "Tawaf is like prayer, except that talking is allowed" (Tirmidhi 963). If the wudu breaks, the tawaf breaks. Start at Hajar al-Aswad and say "Bismillah, Allahu Akbar" for every circuit. Keep the Kaaba on your LEFT and include Hijr Ismail inside your circles. Raml: walk briskly in the first 3 circuits (men, sunnah). Make dua in any language — here you make dua for the beneficiary. Count every circuit with the counter below.',
      points: [
        'Wudu is a condition — no wudu, no tawaf (Tirmidhi 963).',
        'Start every circuit aligned with Hajar al-Aswad: "Bismillah, Allahu Akbar".',
        'Raml in the first 3 circuits for men; normal walk for the last 4.'
      ],
      icon: FaKaaba, img: STEP_IMGS.tawaf,
      need: { counter: { noun: 'Circuit', total: 7 }, photos: 1, gps: true },
      msIdx: 1, closes: true
    },
    {
      key: 'maqam', title: "2 Rak'at Behind Maqam Ibrahim", ar: 'مقام إبراهيم',
      desc: "Pray 2 rak'at behind Maqam Ibrahim (Hanafi: wajib). It is sunnah to recite Surah Al-Kafirun in the first rak'ah and Surah Al-Ikhlas in the second, then make dua for the beneficiary. Upload a photo.",
      points: [
        "Hanafi: these 2 rak'at are wajib.",
        'Sunnah recitation: Surah Al-Kafirun then Surah Al-Ikhlas.',
        'After the prayer, raise your hands in dua for the beneficiary.'
      ],
      icon: FaMosque, img: STEP_IMGS.maqam,
      need: { photos: 1 },
      msIdx: 2, closes: false
    },
    {
      key: 'zamzam', title: 'Drinking Zamzam', ar: 'زمزم',
      desc: 'Drink Zamzam while standing — it is sunnah — and make a dua for the beneficiary after drinking. Upload a photo.',
      points: [
        'Drink standing — the sunnah way of drinking Zamzam.',
        'Zamzam is for whatever intention it is drunk for — intend acceptance for the beneficiary.',
        'A photo with GPS keeps the sponsor updated.'
      ],
      icon: FaTint, img: STEP_IMGS.zamzam,
      need: { photos: 1 },
      msIdx: 2, closes: false
    },
    {
      key: 'sai', title: "Sa'i — Safa to Marwah (7 Rounds)", ar: 'السعي',
      desc: "Start at Safa: face the Kaaba, say 3x takbir and \"La ilaha illallah wahdahu la shareekah lah...\" then make dua. Safa to Marwah is 1 round; complete 7 rounds and finish at Marwah. Men jog loosely between the 2 green fluorescent pillars in honor of Hajira (RA). Make dua for the beneficiary in every round. Fiqh note: in Shafi'i fiqh Sa'i is a rukn; in Hanafi it is wajib (leaving it = dam). Count every round with the counter below.",
      points: [
        "Sa'i starts at Safa and ends at Marwah — 7 walks in total.",
        'Men jog between the two green pillars; walk normally in between.',
        'Dua for the beneficiary on every round.'
      ],
      icon: FaShoePrints, img: STEP_IMGS.sai,
      need: { counter: { noun: 'Round', total: 7 }, photos: 1, gps: true },
      msIdx: 2, closes: true
    },
    {
      key: 'halq', title: 'Halq or Taqsir', ar: 'الحلق والتقصير',
      desc: 'Men: halq (shaving the whole head) is afdal; the minimum taqsir is 1/4 of the head (Hanafi). Women: cut about 2 cm (a fingertip length) from each zulf. With this the ihram ends and all restrictions are lifted — the Umrah is complete. Upload a clear photo; the AI verifies it against the reference picture.',
      points: [
        'Men: halq is better; taqsir must cover at least 1/4 of the head (Hanafi).',
        'Women: about 2 cm from each zulf — no full shave.',
        'All ihram restrictions end only after this step.'
      ],
      icon: FaCut, img: STEP_IMGS.halq,
      need: { photos: 1 },
      msIdx: 3, closes: true
    },
    {
      key: 'finaldua', title: 'Final Dua for the Beneficiary', ar: 'الدعاء الأخير',
      desc: 'At Multazam or anywhere in the Haram, record a video mentioning the beneficiary by name: "O Allah, accept this umrah on behalf of [Name], sponsored by the [Family] family — Ameen." Submit the video with GPS on. When this step is confirmed, the completion certificate is generated for the sponsor.',
      points: [
        'Recommended places: Multazam, after tawaf, at Safa-Marwah, after Zamzam.',
        'The one performing Umrah is the guest of Allah — his dua is accepted (Ibn Majah).',
        'Mention the beneficiary by name and close with Salawat upon the Prophet (PBUH).'
      ],
      icon: FaPrayingHands, img: STEP_IMGS.dua,
      need: { video: true, gps: true, msg: true },
      msgFields: [
        { key: 'beneficiary', label: 'Beneficiary name', ph: 'e.g. Ahmed Ali' },
        { key: 'family', label: 'Family name (sponsor side)', ph: 'e.g. Salman' }
      ],
      msgTpl: (f) => `O Allah, accept this umrah on behalf of ${f.beneficiary || '[Name]'}, sponsored by the ${f.family || '[Family]'} family - Ameen.`,
      msIdx: 4, closes: true
    }
  ],
  // ---- FLOW 3: Hajj Badal (its own 10 guided steps on 5 DB milestones) ----
  hajj: [
    {
      key: 'hprep', title: 'Preparation + Ihram at Miqat', ar: 'الإحرام',
      desc: 'Take ghusl, apply perfume BEFORE the ihram and wear it: men 2 white unstitched sheets, women normal hijab clothing (Hanafi: no naqab/gloves). At the miqat pray 2 rak\'at, then make the HAJJ niyyah and raise the Talbiyah: "Labbayk Allahumma labbayk... labbayka hajjan \'an [Beneficiary] ibn/bint [Mother\'s Name]". Red line: the niyyah is 100% for the beneficiary. The talbiyah message below is sent to the sponsor.',
      points: [
        'The Hajj talbiyah says "hajjan" — the niyyah is for Hajj, not Umrah.',
        "The mother's name is part of the talbiyah (Abu Dawud) — fill it carefully below.",
        'After the niyyah: no perfume, no hair/nail cutting, no hunting.'
      ],
      icon: FaMosque, img: STEP_IMGS.miqat,
      need: { msg: true, photos: 1, gps: true },
      msgFields: [
        { key: 'beneficiary', label: 'Beneficiary name', ph: 'e.g. Ahmed Ali' },
        { key: 'rel', label: 'Relation word', type: 'select', options: [{ v: 'ibn', l: 'ibn (son)' }, { v: 'bint', l: 'bint (daughter)' }] },
        { key: 'mother', label: "Beneficiary's mother's name", ph: 'e.g. Fatima' }
      ],
      msgTpl: (f) => `Labbayk Allahumma labbayk, labbayka laa shareeka laka labbayk. Innal hamda wan ni'mata laka wal mulk, laa shareeka lak. labbayka hajjan 'an ${f.beneficiary || '[Beneficiary]'} ${f.rel || 'ibn/bint'} ${f.mother || "[Mother's Name]"}.`,
      msIdx: 0, closes: false
    },
    {
      key: 'mina', title: 'Mina — Day of Tarwiyah (8 Dhul Hijjah)', ar: 'منى',
      desc: 'Travel to Mina and pray Dhuhr, Asr, Maghrib, Isha and Fajr there. Keep reciting the Talbiyah and make dua for the beneficiary. Upload a photo with your GPS on.',
      points: [
        'Mina is the "city of tents" — the Talbiyah continues here.',
        'Five prayers in Mina: Dhuhr, Asr, Maghrib, Isha and Fajr.',
        'Dua for the beneficiary throughout the stay.'
      ],
      icon: FaCampground, img: STEP_IMGS.mina,
      need: { photos: 1, gps: true },
      msIdx: 0, closes: true
    },
    {
      key: 'arafah', title: 'Arafah — Wuqoof (9 Dhul Hijjah)', ar: 'عرفة',
      desc: 'The pillar of Hajj: stand at Arafah from zawal till sunset making dua for the beneficiary — "the best dua is the dua of Arafah". The wuqoof of even a moment is valid, but stay as long as possible. Upload a photo with your GPS on.',
      points: [
        '"Hajj is Arafah" — without the wuqoof there is no Hajj.',
        'Face the qiblah, raise the hands and make dua till sunset.',
        'GPS verifies the Arafah standing for the sponsor.'
      ],
      icon: FaMountain, img: STEP_IMGS.arafah,
      need: { photos: 1, gps: true },
      msIdx: 1, closes: false
    },
    {
      key: 'muzdalifah', title: 'Muzdalifah — Night', ar: 'مزدلفة',
      desc: 'Leave Arafah after sunset and go to Muzdalifah. Pray Maghrib and Isha combined (qasr), spend the night under the open sky and collect 7 pebbles for the Rami. Upload a photo with your GPS on.',
      points: [
        'Maghrib and Isha are combined and shortened in Muzdalifah.',
        'Resting under the open sky is the sunnah of this night.',
        'Collect 7 small pebbles (the size of a chickpea) for Jamarat al-Aqabah.'
      ],
      icon: FaMoon, img: STEP_IMGS.muzdalifah,
      need: { photos: 1, gps: true },
      msIdx: 1, closes: false
    },
    {
      key: 'rami', title: 'Rami — Jamarat al-Aqabah (10 Dhul Hijjah)', ar: 'رمي الجمار',
      desc: 'On 10 Dhul Hijjah throw 7 pebbles at the big Jamarah (al-Aqabah), saying takbir with every pebble. Count every pebble with the counter below — the Complete button unlocks at 7/7.',
      points: [
        '7 pebbles, one takbir per pebble: "Allahu Akbar".',
        'Only Jamarat al-Aqabah on the 10th — the other two Jamarat come later.',
        'The counter keeps an honest record of all 7 pebbles.'
      ],
      icon: FaBullseye, img: STEP_IMGS.rami,
      need: { counter: { noun: 'Pebble', total: 7 }, photos: 1, gps: true },
      msIdx: 1, closes: false
    },
    {
      key: 'qurbani', title: 'Qurbani / Damm', ar: 'قرباني',
      desc: 'Offer the sacrifice on behalf of the beneficiary (the Tamattu Hajj requires a dam). Upload photos of the sacrifice plus the receipt — both are shown to the sponsor.',
      points: [
        'The dam is wajib in Hajj Tamattu — performed after the Rami.',
        'Eat some of it, gift some, and give some as sadaqah (sunnah split).',
        'Photos + receipt give the sponsor complete transparency.'
      ],
      icon: FaGift, img: STEP_IMGS.qurbani,
      need: { photos: 2, receipt: true },
      msIdx: 1, closes: false
    },
    {
      key: 'tawafzy', title: 'Tawaf al-Ziyarah (7 Circuits)', ar: 'طواف الزيارة',
      desc: 'The rukn (pillar) of Hajj: with wudu, perform 7 circuits around the Kaaba — Kaaba on your LEFT, Hijr Ismail included, raml in the first 3 circuits (men, sunnah) — making dua for the beneficiary in every circuit. Count every circuit with the counter below.',
      points: [
        'Without Tawaf al-Ziyarah the Hajj is not valid.',
        'Wudu is a condition, exactly like the Umrah tawaf.',
        'Dua for the beneficiary on every circuit.'
      ],
      icon: FaKaaba, img: STEP_IMGS.tawaf,
      need: { counter: { noun: 'Circuit', total: 7 }, photos: 1, gps: true },
      msIdx: 1, closes: true
    },
    {
      key: 'hsai', title: "Sa'i — Safa to Marwah (7 Rounds)", ar: 'السعي',
      desc: "Start at Safa with 3x takbir and the tahlil, complete 7 rounds ending at Marwah, men jogging between the 2 green pillars. Make dua for the beneficiary in every round and count every round with the counter below.",
      points: [
        "7 rounds, starting at Safa and ending at Marwah.",
        'Men jog between the two green fluorescent pillars.',
        'Dua for the beneficiary on every round.'
      ],
      icon: FaShoePrints, img: STEP_IMGS.sai,
      need: { counter: { noun: 'Round', total: 7 }, photos: 1, gps: true },
      msIdx: 2, closes: true
    },
    {
      key: 'hhalq', title: 'Halq / Taqsir', ar: 'الحلق',
      desc: 'After the qurbani on 10 Dhul Hijjah: men shave the head (halq, afdal) or trim 1/4 of the head minimum (taqsir, Hanafi); women cut about 2 cm from each zulf. With this the ihram restrictions end. Upload a clear photo; the AI verifies it against the reference picture.',
      points: [
        'Halq is better for men; the minimum taqsir is 1/4 of the head.',
        'Women: about 2 cm from each zulf.',
        'All restrictions end except the marital ones (until Tawaf al-Ziyarah is done).'
      ],
      icon: FaCut, img: STEP_IMGS.halq,
      need: { photos: 1 },
      msIdx: 3, closes: true
    },
    {
      key: 'wada', title: 'Tawaf al-Wada + Final Dua', ar: 'طواف الوداع',
      desc: 'Perform the farewell tawaf (Tawaf al-Wada — the final obligation for Hanafi), then record the final dua video mentioning the beneficiary by name: "O Allah, accept this Hajj on behalf of [Name], sponsored by the [Family] family — Ameen." Submit the video with GPS on. When this step is confirmed, the completion certificate is generated for the sponsor.',
      points: [
        'Tawaf al-Wada is the last rukn of the Hajj journey.',
        'The final dua video mentions the beneficiary by name.',
        'Completing this step completes the task and unlocks the certificate.'
      ],
      icon: FaPrayingHands, img: STEP_IMGS.dua,
      need: { video: true, gps: true, msg: true },
      msgFields: [
        { key: 'beneficiary', label: 'Beneficiary name', ph: 'e.g. Ahmed Ali' },
        { key: 'family', label: 'Family name (sponsor side)', ph: 'e.g. Salman' }
      ],
      msgTpl: (f) => `O Allah, accept this Hajj on behalf of ${f.beneficiary || '[Name]'}, sponsored by the ${f.family || '[Family]'} family - Ameen.`,
      msIdx: 4, closes: true
    }
  ]
};

const KIND_LABEL = { donation: 'Sadaqah', umrah: 'Umrah Badal', hajj: 'Hajj Badal' };
const flowStepLib = (flow) => FLOW_STEPS[flow] || FLOW_STEPS.umrah;

// ============================================================
// SAFE DATA HELPERS — every read is crash-proof
// ============================================================
const stepText = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const cand = v.step || v.name || v.title || v.label || v.text || '';
    return typeof cand === 'string' ? cand : '';
  }
  return String(v);
};
const pickStr = (...vals) => {
  for (const v of vals) {
    if (v == null) continue;
    if (typeof v === 'string' && v.trim() !== '' && v.trim().toLowerCase() !== 'n/a') return v.trim();
    if (typeof v === 'number' && String(v) !== '') return String(v);
  }
  return '';
};
const DONATION_KEYS = ['donat', 'sadaqah', 'sadqa', 'sadaka', 'gift', 'qurbani', 'zakat', 'food', 'ration', 'water', 'well', 'tree', 'blanket', 'iftar', 'bundle', 'charity', 'kifalat'];

// FLOW 1 (donation) vs FLOW 2 (ibadah) — keyword detection on the
// service/request fields. Umrah/Hajj always win so "Umrah Badal" is
// never misread as a donation.
const isDonation = (o) => {
  if (!o || typeof o !== 'object') return false;
  const hay = `${pickStr(o.serviceType)} ${pickStr(o.requestType)} ${pickStr(o.category)} ${pickStr(o.subService)} ${pickStr(o.title)} ${pickStr(o.packageId && typeof o.packageId === 'object' ? o.packageId.category : '')} ${pickStr(o.packageId && typeof o.packageId === 'object' ? o.packageId.name : '')}`.toLowerCase();
  if (hay.includes('umrah') || hay.includes('hajj')) return false;
  return DONATION_KEYS.some(k => hay.includes(k));
};
const milestoneProgress = (order) => {
  const ms = (order && order.milestones) || [];
  const done = ms.filter(isMilestoneCompleted).length;
  return { done, total: ms.length, pct: ms.length ? Math.round((done / ms.length) * 100) : 0 };
};
const isMilestoneCompleted = (milestone) =>
  Boolean(milestone && (milestone.isCompleted || String(milestone.status || '').toLowerCase() === 'completed'));
// On-time check: order completed within 24h of creation (+50 pts rule)
const onTimeCheck = (o) => {
  const t = new Date(o.updatedAt) - new Date(o.createdAt);
  return t > 0 && t <= 24 * 3600 * 1000;
};

// ---------- DISPLAY FLOW (donation | umrah | hajj) ----------
const flowOf = (o) => {
  if (!o) return 'umrah';
  const st = pickStr(o.serviceType).toLowerCase();
  if (st.includes('hajj')) return 'hajj';
  if (st.includes('umrah')) return 'umrah';
  if (isDonation(o)) return 'donation';
  return 'umrah';
};

// ---------- REAL PACKAGE / REQUEST IDENTITY ----------
const pkgOf = (o) => {
  if (!o || typeof o !== 'object') return null;
  const cands = [o.packageId, o.package, o.packageInfo, o.requestPackage];
  for (const c of cands) {
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      const name = pickStr(c.name, c.title, c.packageName);
      if (name) return { name, desc: pickStr(c.description, c.desc, c.details, c.summary), img: pickStr(c.image, c.img, c.imageUrl, c.imageURL), cat: pickStr(c.category, c.flow, c.serviceType) };
    }
  }
  const name = pickStr(o.packageName, o.packageTitle, o.requestTitle, o.requestName);
  if (name) return { name, desc: pickStr(o.packageDescription, o.requestDescription, o.description), img: pickStr(o.packageImage, o.imageUrl, o.imageURL), cat: '' };
  return null;
};
const taskTitle = (o) => {
  const p = pkgOf(o);
  if (p && p.name) return p.name;
  const st = pickStr(o && o.serviceType, 'Ibadah Task');
  const rn = pickStr(o && o.recipientName);
  return rn ? `${st} for ${rn}` : st;
};
const FLOW_DESC = {
  donation: 'A charity delivery request guided in 4 steps: type the niyyah message for the sponsor, buy the items (photos + receipt + GPS), hand them over with a GPS-verified video, and close with a report + dua. Each step opens one by one; the sponsor sees every proof live.',
  umrah: 'Umrah Badal on behalf of the sponsored person, guided in 10 authentic steps: Preparation, Miqat Niyyah + Talbiyah, Journey, Entering the Haram, Tawaf (7 circuits with counter), 2 rak\'at at Maqam Ibrahim, Zamzam, Sa\'i (7 rounds with counter), Halq/Taqsir and the Final Dua with the beneficiary\'s name.',
  hajj: 'Hajj Badal on behalf of the sponsored person, guided in its own 10 steps: Ihram at the Miqat, Mina, Arafah wuqoof, Muzdalifah, Rami (7 pebbles with counter), Qurbani/Damm, Tawaf al-Ziyarah (7 circuits with counter), Sa\'i (7 rounds with counter), Halq/Taqsir and Tawaf al-Wada with the final dua.',
};
const taskDesc = (o) => {
  const p = pkgOf(o);
  if (p && p.desc) return p.desc;
  return FLOW_DESC[flowOf(o)] || '';
};
// Short order code + human date (reference design: "Order # IC-1042", "Assigned by Admin — Nov 6, 2:45 PM")
const orderCode = (o) => {
  if (!o) return '—';
  if (o.orderCode || o.orderNumber || o.orderId) return String(o.orderCode || o.orderNumber || o.orderId);
  return o._id ? `IC-${String(o._id).slice(-6).toUpperCase()}` : '—';
};
const FLOW_CHIP = {
  donation: { label: 'Donation', cls: 'bg-stone-100 text-stone-700 border-stone-200' },
  umrah: { label: 'Umrah Badal', cls: 'bg-green-50 text-green-800 border-green-200' },
  hajj: { label: 'Hajj Badal', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
};

// ---------- GUIDED STEP LEDGER (per order, per device) ----------
// The DB milestone template is never changed; guided sub-steps keep
// their proofs in this local ledger and the group's LAST step submits
// the milestone proof to the sponsor through update-milestone.
const LEDGER_KEY = (orderId) => `ic_steps_${orderId}`;
const loadLedger = (orderId) => {
  const v = LS.get(LEDGER_KEY(orderId || ''), []);
  return Array.isArray(v) ? v : [];
};
const saveLedgerEntry = (orderId, entry) => {
  const arr = loadLedger(orderId);
  const i = arr.findIndex(e => Number(e.idx) === Number(entry.idx));
  if (i >= 0) arr[i] = entry; else arr.push(entry);
  LS.set(LEDGER_KEY(orderId), arr);
};

// A guided step is DONE when its milestone group is already completed in
// the DB (authoritative, survives device switch) or it exists in the
// local ledger. Closing steps complete only through the DB milestone.
const stepDone = (order, steps, idx, ledger) => {
  const st = steps[idx];
  if (!st) return false;
  const groupsDone = ((order && order.milestones) || []).filter(isMilestoneCompleted).length;
  if (groupsDone > st.msIdx) return true;
  if (st.closes) return false;
  return (ledger || []).some(e => Number(e.idx) === Number(idx));
};
const guidedProgress = (order) => {
  const steps = flowStepLib(flowOf(order));
  const ledger = loadLedger(order && order._id);
  const done = steps.filter((_, i) => stepDone(order, steps, i, ledger)).length;
  return { done, total: steps.length, pct: steps.length ? Math.round((done / steps.length) * 100) : 0 };
};

// ---------- v8.0 SPONSOR RESOLVER — the performer never sees their own name ----------
// orders v2 (backend/routes/orders-v2.js) computes sponsorName on the SERVER
// from the populated sponsor document and attaches it to every order
// response, so "Sponsor: Not yet assigned" is fixed at the source. The
// resolver below still defends older backends:
//   1) sponsorObjOf trusts order.sponsorName first (v8.0 — server-guaranteed),
//      then order.sponsor / order.user / order.customer / order.orderedBy
//      (raw ObjectId strings are ignored — they are not displayable names);
//   2) sponsorLabelOf refuses to return the logged-in performer (id OR
//      full-name match) — the UI shows "—" instead of your own name;
//   3) a console.warn (below, in the component) names the delivered
//      orders-v2.js file if the backend is still the old one.
const SPONSOR_DEBUG = true;
const nameOfUser = (u) => (u && typeof u === 'object') ? `${pickStr(u.firstName)} ${pickStr(u.lastName)}`.trim() : '';
const sponsorIdOf = (u) => (u && typeof u === 'object' && u._id) ? String(u._id) : (typeof u === 'string' ? u : null);
const looksLikeObjectId = (s) => typeof s === 'string' && /^[0-9a-f]{24}$/.test(s.trim());
const sponsorObjOf = (o) => {
  if (!o || typeof o !== 'object') return null;
  // v8.0: sponsorName arrives computed by orders v2 on EVERY response — trust it first.
  if (typeof o.sponsorName === 'string' && o.sponsorName.trim() !== '' && !looksLikeObjectId(o.sponsorName)) return { firstName: o.sponsorName.trim(), lastName: '' };
  const cands = [o.sponsor, o.user, o.customer, o.orderedBy];
  for (const c of cands) {
    if (!c) continue;
    if (typeof c === 'object' && nameOfUser(c)) return c;
    if (typeof c === 'string' && c.trim() !== '' && !looksLikeObjectId(c)) return { firstName: c.trim(), lastName: '' };
  }
  return null;
};
const sponsorLabelOf = (o, self) => {
  const s = sponsorObjOf(o);
  if (!s) return '';
  const selfId = String((self && self.id) || '');
  const sid = sponsorIdOf(s);
  if (sid && selfId && sid === selfId) return '';
  const name = nameOfUser(s);
  const selfName = self ? `${pickStr(self.firstName)} ${pickStr(self.lastName)}`.trim().toLowerCase() : '';
  if (name && selfName && name.toLowerCase() === selfName) return '';
  return name;
};

// Default values for the message template fields (sponsor / recipient /
// mother's name pulled from the real order data whenever available).
// v6.1: takes the logged-in performer (3rd arg) — the sponsor slots of the
// niyyah / talbiyah / report templates are never pre-filled with the
// performer's own name.
const defaultMsgFields = (order, st, self) => {
  const f = {};
  const sponsorName = sponsorLabelOf(order, self);
  const recipient = pickStr(order.recipientName);
  const mother = pickStr(order.recipientMotherName, order.motherName, order.beneficiaryMotherName);
  (st.msgFields || []).forEach((fd) => {
    if (fd.key === 'behalf') f[fd.key] = sponsorName || recipient;
    else if (fd.key === 'beneficiary') f[fd.key] = recipient || sponsorName;
    else if (fd.key === 'soul') f[fd.key] = recipient;
    else if (fd.key === 'mother') f[fd.key] = mother;
    else if (fd.key === 'family') f[fd.key] = sponsorName ? sponsorName.split(' ').pop() : '';
    else if (fd.key === 'rel') f[fd.key] = 'ibn';
    else if (fd.key === 'delivered') f[fd.key] = taskTitle(order);
    else if (fd.key === 'place') f[fd.key] = pickStr(order.city, order.area);
    else f[fd.key] = '';
  });
  return f;
};

// ---------- Makkah Prayer / Weather helpers (free APIs, no key) ----------
const makkahNow = () => new Date(Date.now() + (3 * 60 + new Date().getTimezoneOffset()) * 60000); // Makkah = UTC+3, no DST
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const cleanTime = (s) => (s || '').slice(0, 5);
const nextPrayerOf = (timings) => {
  const now = makkahNow();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (const name of PRAYER_ORDER) {
    const parts = cleanTime(timings[name]).split(':');
    const t = (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
    if (t > nowMin) return { name, at: t, left: t - nowMin };
  }
  const p = cleanTime(timings.Fajr).split(':');
  const f = (Number(p[0]) || 0) * 60 + (Number(p[1]) || 0);
  return { name: 'Fajr', at: f, left: 1440 - nowMin + f };
};
const wmoText = (c) => c === 0 ? 'Clear sky' : c <= 2 ? 'Partly cloudy' : c === 3 ? 'Overcast' : c <= 48 ? 'Foggy' : c <= 57 ? 'Light drizzle' : c <= 67 ? 'Rain' : c <= 77 ? 'Snow' : c <= 82 ? 'Rain showers' : c <= 86 ? 'Snow showers' : 'Thunderstorm';
const timeAgo = (d) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h ago`;
};

// ---------- Animation hooks ----------
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = Number(target) || 0;
    if (t <= 0) { setVal(0); return; }
    let raf; const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setVal(Math.round(t * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ ms ]);
  return now;
}

// ============================================================
// GAMIFICATION CONFIG — Points, Levels, Payout tiers
// Points are DERIVED from real DB data (no Order.js change).
// Streak / guide / bank / payouts live in localStorage.
// Gold+ tier unlocks the 88% payout (vs standard 85%).
// ============================================================
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const LEVELS = [
  { name: 'Bronze', min: 0, max: 500, color: '#B45309', payout: '85%', perk: 'Normal task access' },
  { name: 'Silver', min: 500, max: 1500, color: '#64748B', payout: '85%', perk: 'Priority queue entry' },
  { name: 'Gold', min: 1500, max: 3500, color: '#D4AF37', payout: '88%', perk: '88% payout + premium Umrah/Hajj Badal tasks' },
  { name: 'Platinum', min: 3500, max: Infinity, color: '#0F766E', payout: '88%', perk: 'Senior Scholar badge + featured profile' },
];
const levelOf = (pts) => { let i = 0; LEVELS.forEach((l, li) => { if (pts >= l.min) i = li; }); return i; };

// ============================================================
// v6.2 PROFESSIONAL TYPE SYSTEM — one scoped style block normalizes
// the whole portal: Inter (professional UI font), calm font weights
// (no more extrabold-everywhere), tighter letter spacing, consistent
// sizes/radii/shadows. No other JSX needs touching for typography.
// ============================================================
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.ibd-pro { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-variant-numeric: tabular-nums; }
.ibd-pro button, .ibd-pro input, .ibd-pro select, .ibd-pro textarea { font-family: inherit; }
/* v7.0 type scale — serif display headings + medium-weight UI text (mockup) */
.ibd-pro .font-serif { font-family: 'Newsreader', Georgia, 'Times New Roman', serif; }
.ibd-pro .font-extrabold { font-weight: 700; }
.ibd-pro .font-bold { font-weight: 600; }
.ibd-pro .tracking-widest { letter-spacing: 0.08em; }
.ibd-pro .tracking-wider { letter-spacing: 0.05em; }
.ibd-pro [class*="text-[9px]"] { font-size: 10px; }
.ibd-pro .text-2xl { font-size: 1.375rem; line-height: 1.75rem; }
.ibd-pro .text-3xl { font-size: 1.5rem; line-height: 2rem; }
.ibd-pro .text-4xl { font-size: 1.875rem; line-height: 2.25rem; }
.ibd-pro .rounded-2xl { border-radius: 0.75rem; }
.ibd-pro .shadow-2xl { box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.22); }
.ibd-pro .shadow-sm { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03); }
/* v7.0 FOREST PALETTE — primary -> forest #0F4D38 (hover #0A3B2B), accent -> gold.
   The logo keeps its own colors (inline styles) and status dots stay green/gold/red. */
.ibd-pro [class*="text-primary/"] { color: #4E7A63; }
.ibd-pro [class*="text-primary"]:not([class*="text-primary/"]) { color: #0F4D38; }
.ibd-pro [class*="bg-primary/"] { background-color: #F0F5F2; }
.ibd-pro [class*="hover:bg-primary"] { background-color: #0F4D38; }
.ibd-pro [class*="hover:bg-primary"]:hover { background-color: #0A3B2B; }
.ibd-pro [class*="bg-primary"]:not([class*="bg-primary/"]):not([class*="hover:"]) { background-color: #0F4D38; }
.ibd-pro [class*="focus:border-primary"]:focus { border-color: #0F4D38; }
.ibd-pro [class*="border-primary/"] { border-color: #D8E3DB; }
.ibd-pro [class*="hover:border-primary"]:hover { border-color: #BFD3C5; }
.ibd-pro [class*="border-primary"]:not([class*="border-primary/"]):not([class*="focus:"]):not([class*="hover:"]) { border-color: #0F4D38; }
.ibd-pro [class*="text-accent"] { color: #8F6D32; }
.ibd-pro [class*="bg-accent"]:not([class*="hover:"]) { background-color: #C29845; }
.ibd-pro [class*="border-accent"] { border-color: #E3D9C2; }
/* v7.0 NEUTRAL REMAP — the mockup's green-gray surfaces, borders and text */
.ibd-pro .border-gray-100 { border-color: #EDF1ED; }
.ibd-pro .border-gray-200 { border-color: #E3E8E3; }
.ibd-pro .border-gray-300 { border-color: #D5DCD5; }
.ibd-pro .bg-gray-50 { background-color: #FBFDFB; }
.ibd-pro .bg-gray-100 { background-color: #F0F3F0; }
.ibd-pro .bg-gray-200 { background-color: #E5EAE5; }
.ibd-pro .text-gray-300 { color: #AEBBB2; }
.ibd-pro .text-gray-400 { color: #8B9890; }
.ibd-pro .text-gray-500 { color: #69786F; }
.ibd-pro .text-gray-600 { color: #55635B; }
.ibd-pro .text-gray-700 { color: #3F4F46; }
.ibd-pro .text-gray-800 { color: #2A332E; }
.ibd-pro .text-gray-900 { color: #163D2E; }
/* pastel colored surfaces -> one soft green surface */
.ibd-pro .bg-green-50, .ibd-pro .bg-green-100, .ibd-pro .bg-teal-50, .ibd-pro .bg-amber-50, .ibd-pro .bg-amber-100, .ibd-pro .bg-blue-50, .ibd-pro .bg-blue-100, .ibd-pro .bg-yellow-50, .ibd-pro .bg-yellow-100, .ibd-pro .bg-red-50, .ibd-pro .bg-red-100, .ibd-pro .bg-purple-50, .ibd-pro .bg-stone-100 { background-color: #F4F7F4; }
.ibd-pro .border-green-100, .ibd-pro .border-blue-100, .ibd-pro .border-amber-100 { border-color: #E8EEE8; }
.ibd-pro .border-green-200, .ibd-pro .border-teal-200, .ibd-pro .border-amber-200, .ibd-pro .border-blue-200, .ibd-pro .border-yellow-200, .ibd-pro .border-red-200, .ibd-pro .border-purple-200, .ibd-pro .border-stone-200 { border-color: #DCE4DC; }
.ibd-pro .border-green-300 { border-color: #CBD8CD; }
/* colored text -> calm graphite (status dots keep their colors) */
.ibd-pro .text-green-700, .ibd-pro .text-green-800, .ibd-pro .text-green-600, .ibd-pro .text-teal-800, .ibd-pro .text-stone-700, .ibd-pro .text-blue-700, .ibd-pro .text-blue-600, .ibd-pro .text-blue-500, .ibd-pro .text-amber-700, .ibd-pro .text-amber-600, .ibd-pro .text-yellow-700, .ibd-pro .text-yellow-600, .ibd-pro .text-yellow-400, .ibd-pro .text-purple-700, .ibd-pro .text-purple-600, .ibd-pro .text-purple-400 { color: #3F4F46; }
`;

// Animated stat card (count-up on load)
function CountStat({ icon: Ic, label, value, prefix = '', suffix = '', tone = 'text-gray-800', sub }) {
  const v = useCountUp(value == null ? 0 : value);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <Ic className="text-primary/50" />
      </div>
      <p className={`text-2xl font-extrabold mt-1.5 ${tone}`}>{value == null ? '\u2014' : `${prefix}${v.toLocaleString()}${suffix}`}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1 leading-snug">{sub}</p>}
    </div>
  );
}

// Task timer - "opened Xh ago" + 24h urgency bar
function TaskTimer({ order, mode = 'assigned', now }) {
  if (!order || !order.createdAt || !now) return null;
  const mins = Math.max(0, Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 60000));
  const over = mins >= 1440;
  const pct = Math.min(100, Math.round((mins / 1440) * 100));
  return (
    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
      <div className="flex justify-between items-center gap-2 text-[11px] font-bold">
        <span className="text-gray-500 flex items-center gap-1"><FaClock /> Task opened {timeAgo(order.createdAt)}</span>
        <span className={over ? 'text-red-600' : 'text-amber-600'}>{over ? 'Past the 24h target - act now' : mode === 'active' ? 'Finish within 24h for the +50 on-time bonus' : 'Recommended start within 24h'}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
        <div className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}

// Today's Briefing - Makkah prayer countdown + weather + queue position + hijri date
function BriefingCard({ prayerData, weather, queuePos, etaText, openCount }) {
  const np = prayerData ? nextPrayerOf(prayerData.timings) : null;
  const hh = np ? Math.floor(np.left / 60) : 0;
  const mm = np ? np.left % 60 : 0;
  const hijri = prayerData && prayerData.hijri;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <FaCalendarAlt className="text-primary" />
        <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Today&apos;s Briefing - Makkah</p>
        {hijri && <span className="ml-auto text-[10px] font-bold text-gray-400">{hijri.day} {hijri.month ? hijri.month.en : ''} {hijri.year} AH</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><FaMosque className="text-primary" /> Next Prayer</p>
          {np ? (
            <>
              <p className="text-xl font-extrabold text-gray-800 mt-1">{np.name} <span className="text-sm font-bold text-primary">in {hh > 0 ? `${hh}h ` : ''}{mm}m</span></p>
              <div className="flex flex-wrap gap-1 mt-2">
                {PRAYER_ORDER.map(name => (
                  <span key={name} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${np.name === name ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {name} {cleanTime(prayerData.timings[name])}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><FaInfoCircle /> Prayer times unavailable (offline).</p>
          )}
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><FaCloudSun className="text-accent" /> Weather</p>
          {weather ? (
            <>
              <p className="text-xl font-extrabold text-gray-800 mt-1">{weather.temp}&deg;C <span className="text-xs font-bold text-gray-400">{wmoText(weather.code)}</span></p>
              <p className="text-[10px] text-gray-400 mt-1.5">Plan outdoor steps (Sa&apos;i, travel) around Dhuhr heat.</p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><FaInfoCircle /> Weather unavailable (offline).</p>
          )}
        </div>
        <div className="p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><FaChartBar className="text-primary" /> Your Queue</p>
          <p className="text-xl font-extrabold text-gray-800 mt-1">#{queuePos} <span className="text-xs font-bold text-gray-400">position - next task {etaText}</span></p>
          <p className="text-[10px] text-gray-400 mt-1.5">{openCount} open request(s) in system - Priority improves with level.</p>
        </div>
      </div>
      {hijri && hijri.month && hijri.month.number === 9 && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-gray-700 flex items-center gap-2">
          <FaMoon /> <p className="text-xs font-bold">Ramadan Mubarak - high task volume expected. Keep your availability ON.</p>
        </div>
      )}
      {hijri && hijri.month && hijri.month.number === 12 && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-gray-700 flex items-center gap-2">
          <FaKaaba /> <p className="text-xs font-bold">Dhul-Hijjah season - Hajj Badal requests peak in these days.</p>
        </div>
      )}
    </div>
  );
}

// Level ring - the gamification core loop
function LevelRing({ totalPoints, lvl, lvlProgress, nextLvl, queuePos }) {
  const pts = useCountUp(totalPoints);
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-[132px] h-[132px] flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={R} stroke="#e5e7eb" strokeWidth="10" fill="none" />
          <circle cx="60" cy="60" r={R} stroke={lvl.color} strokeWidth="10" fill="none" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - lvlProgress / 100)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400">Level</p>
          <p className="text-lg font-extrabold" style={{ color: lvl.color }}>{lvl.name}</p>
          <p className="text-[11px] font-bold text-gray-600">{pts.toLocaleString()} pts</p>
        </div>
      </div>
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="font-extrabold text-gray-800">Performer Level - {lvl.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {nextLvl ? `${(nextLvl.min - totalPoints).toLocaleString()} points to reach ${nextLvl.name}` : 'Highest tier reached - Senior Scholar status.'}
        </p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-2.5">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Payout tier: {lvl.payout}</span>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">{lvl.perk}</span>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Queue #{queuePos}</span>
        </div>
      </div>
    </div>
  );
}

// Trophy shelf - unlocked badges glow, locked slots show the remaining progress
function BadgeShelf({ badges }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-extrabold text-gray-800 flex items-center gap-2"><FaTrophy className="text-accent" /> Trophy Case</h3>
        <span className="text-[10px] font-bold text-gray-400">{badges.filter(b => b.have).length}/{badges.length} unlocked</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {badges.map(b => (
          <div key={b.id} className={`rounded-xl border p-3 text-center transition-all ${b.have ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
            <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center ${b.have ? 'bg-accent text-white shadow' : 'bg-gray-200 text-gray-400'}`}>
              {b.have ? <b.icon /> : <FaLock className="text-xs" />}
            </div>
            <p className={`text-[11px] font-extrabold mt-1.5 ${b.have ? 'text-gray-800' : 'text-gray-400'}`}>{b.name}</p>
            <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{b.desc}</p>
            <p className={`text-[9px] font-bold mt-1 ${b.have ? 'text-green-600' : 'text-gray-400'}`}>{b.have ? 'Unlocked' : b.prog}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Earnings chart (pure CSS bars - zero dependencies, React 19 safe)
function EarningsChart({ chartData, earnRange, setEarnRange, share }) {
  const max = Math.max(...chartData.map(b => b.sum), 1);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-extrabold text-gray-800 flex items-center gap-2"><FaChartBar className="text-primary" /> Earnings Chart</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setEarnRange('week')} className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${earnRange === 'week' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Weekly (8w)</button>
          <button onClick={() => setEarnRange('month')} className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors ${earnRange === 'month' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Monthly (6m)</button>
        </div>
      </div>
      <div className="flex items-end gap-2 h-44 mt-3">
        {chartData.map((b, i) => (
          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1 group">
            <span className="text-[9px] font-bold text-gray-400 group-hover:text-primary">{b.sum > 0 ? b.sum.toLocaleString() : ''}</span>
            <div className="w-full rounded-t-md bg-gradient-to-t from-primary to-emerald-400 group-hover:brightness-110 transition-all"
              style={{ height: `${Math.max(2, (b.sum / max) * 80)}%` }} title={`PKR ${b.sum.toLocaleString()}`}></div>
            <span className="text-[9px] font-bold text-gray-400">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">Donation tasks are excluded (price hidden rule). Share tier: {Math.round(share * 100)}%.</p>
    </div>
  );
}

// ============================================================
// CIRCUIT COUNTER (Tawaf / Tawaf al-Ziyarah 7x, Sa'i 7x, Rami 7x)
// Tap +1 after every circuit/round/pebble. Progress dots + saved per
// order on this device. The Complete button stays disabled until
// total/total — "jab tak step 1 nai hoga step 2 nai hoskta".
// ============================================================
function CircuitCounter({ noun, total, count, onBump, onReset }) {
  const done = count >= total;
  return (
    <div className={`mt-2.5 rounded-xl border p-3 ${done ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex justify-between items-center gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-gray-600">
          <FaKaaba className={done ? 'text-green-600' : 'text-accent'} /> {noun} Counter — {count} / {total} {done ? '— complete' : ''}
        </p>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onReset} disabled={count === 0} title="Reset counter" className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 font-extrabold disabled:opacity-40 hover:text-red-500 transition-colors flex items-center justify-center text-xs"><FaSyncAlt /></button>
          <button onClick={() => onBump(count - 1)} disabled={count === 0} className="w-7 h-7 rounded-lg bg-white border border-gray-200 font-extrabold text-gray-600 disabled:opacity-40">-</button>
          <button onClick={() => onBump(count + 1)} disabled={done} className="w-7 h-7 rounded-lg bg-primary text-white font-extrabold disabled:opacity-40">+1</button>
        </div>
      </div>
      <div className="flex gap-1.5 mt-2">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`flex-1 h-2 rounded-full transition-colors ${i < count ? 'bg-green-500' : 'bg-white border border-gray-200'}`}></span>
        ))}
      </div>
      <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
        {done
          ? `All ${total} ${noun.toLowerCase()}s complete — you can submit the proof now.`
          : `Tap +1 after every ${noun.toLowerCase()} — the Complete button unlocks at ${total}/${total}. Progress is saved on this device.`}
      </p>
    </div>
  );
}

// ============================================================
// v6.0 GUIDED STEP FLOW (replaces the old milestone checklist)
// Renders the package-specific guided steps with sequential lock:
// step N+1 waits for step N, a completed step is locked permanently,
// every step shows its description + golden points + reference pic,
// counter steps show the 7x tap counter, and the group's LAST step
// sends the milestone proof to the sponsor.
// ============================================================
function StepFlow({ order, openStepModal, logTick }) {
  const flow = flowOf(order);
  const steps = flowStepLib(flow);
  const orderId = order && order._id;
  const [ledger, setLedger] = useState(() => loadLedger(orderId));
  useEffect(() => { setLedger(loadLedger(orderId)); }, [orderId, logTick]);

  const doneArr = steps.map((_, i) => stepDone(order, steps, i, ledger));
  const doneCount = doneArr.filter(Boolean).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const firstOpen = doneArr.findIndex(d => !d);

  // 7x counter state for the CURRENT step only (Tawaf / Sa'i / Rami)
  const curStep = firstOpen >= 0 ? steps[firstOpen] : null;
  const counter = (curStep && curStep.need && curStep.need.counter) ? curStep.need.counter : null;
  const ck = counter && orderId ? `ic_circ_${orderId}_${firstOpen}` : '';
  const [circ, setCirc] = useState(() => (ck ? (Number(LS.get(ck, 0)) || 0) : 0));
  useEffect(() => { setCirc(ck ? (Number(LS.get(ck, 0)) || 0) : 0); }, [ck]);
  const bumpCirc = (n) => { if (!ck || !counter) return; const v = Math.max(0, Math.min(counter.total, n)); setCirc(v); LS.set(ck, v); };
  const circDone = !counter || circ >= counter.total;

  return (
    <div>
      {/* Steps header (mockup: slim heading + gold progress line) */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#14261C]">Steps</h3>
        <p className="text-xs text-[#6A7870] font-medium">{doneCount} of {steps.length} complete ({pct}%)</p>
      </div>
      <div className="w-full bg-[#E5EAE5] h-1 rounded-full overflow-hidden mb-5">
        <div className="bg-[#114634] h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
      </div>
      <p className="text-xs text-[#69786F] leading-relaxed mb-6">Steps open one by one in the correct sharai order — complete a step with proof and the next one unlocks. A completed step is locked permanently.</p>

      <div className="relative">
        <div className="absolute left-[13px] top-4 bottom-8 w-[1px] bg-[#E3E8E3]" aria-hidden="true"></div>
        {steps.map((g, idx) => {
          const isDone = doneArr[idx];
          const isLocked = !isDone && idx > firstOpen;
          const isCurrent = !isDone && idx === firstOpen;
          const entry = (ledger || []).find(e => Number(e.idx) === Number(idx));
          const msObj = (order.milestones || [])[g.msIdx];
          const mProofUrl = isMilestoneCompleted(msObj) ? msObj.proofUrl : '';
          return (
            <div key={g.key} className="relative flex items-start gap-3.5 pb-7 last:pb-0">
              {/* Timeline circle (mockup: numbered, continuous line behind) */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-4 ring-white relative z-10 ${isDone ? 'bg-[#114634] text-white' : isCurrent ? 'bg-[#114634] text-white' : 'border border-[#D5DCD5] bg-white text-[#56655C]'}`}>
                {isDone ? <FaCheck className="text-[10px]" /> : idx + 1}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                    <h4 className={`text-sm leading-snug ${isDone ? 'font-semibold text-[#18271E] line-through' : isCurrent ? 'font-semibold text-[#18271E]' : 'font-normal text-[#38463F]'}`}>{g.title}</h4>
                    {g.ar && <span className="font-amiri text-gray-400 text-sm leading-none">{g.ar}</span>}
                    <span className={`text-xs ${isDone ? 'text-[#0E4A35] font-medium' : isCurrent ? 'text-[#5F6E65]' : 'text-[#8B9890]'}`}>{isDone ? 'Completed' : isCurrent ? 'Current step' : 'Locked'}</span>
                    {g.closes && isCurrent && <span className="text-[10px] font-medium text-[#4C5B52] border border-[#CCD5CD] bg-[#FBFDFB] px-2 py-0.5 rounded-md">sends milestone proof</span>}
                  </div>

                  {/* Detailing */}
                  {g.desc && !isLocked && <p className="text-[11px] text-gray-500 leading-relaxed mt-1.5">{g.desc}</p>}

                  {/* Golden Points */}
                  {g.points && g.points.length > 0 && !isLocked && (
                    <div className="mt-2 bg-gray-50 border-l-2 border-gray-300 rounded-r-lg px-2.5 py-2">
                      <p className="text-[9px] font-extrabold text-yellow-700 tracking-wider flex items-center gap-1"><FaStar className="text-accent" /> GOLDEN POINTS</p>
                      <ul className="mt-1 space-y-1">
                        {g.points.map((p, pi) => (
                          <li key={pi} className="text-[11px] text-gray-600 leading-snug flex gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0"></span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Proof requirements chips (current step) */}
                  {isCurrent && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {g.need.msg && <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">Message to sponsor</span>}
                      {g.need.photos ? <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">{g.need.photos}+ photo(s)</span> : null}
                      {g.need.receipt && <span className="text-[9px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">Receipt</span>}
                      {g.need.video && <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Video proof</span>}
                      {g.need.gps && <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">Location ON</span>}
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">AI check (min {AI_MATCH_MIN}%)</span>
                    </div>
                  )}

                  {/* 7x counter (current step only) */}
                  {isCurrent && counter && (
                    <CircuitCounter noun={counter.noun} total={counter.total} count={circ} onBump={bumpCirc} onReset={() => bumpCirc(0)} />
                  )}

                  {/* Completed step summary from the local ledger */}
                  {isDone && entry && (
                    <div className="mt-2 bg-white border border-gray-100 rounded-lg p-2.5">
                      {entry.msg && <p className="text-[11px] text-gray-600 leading-snug"><span className="font-extrabold text-gray-500">Message sent: </span>{entry.msg}</p>}
                      {entry.note && <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{entry.note}</p>}
                      {entry.urls && entry.urls.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {entry.urls.map((u, ui) => (
                            <a key={ui} href={u} target="_blank" rel="noreferrer"><img src={u} alt={`proof ${ui + 1}`} className="w-10 h-10 object-cover rounded-md border border-gray-200" /></a>
                          ))}
                          {entry.receiptUrl && <a href={entry.receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 underline">Receipt</a>}
                          {entry.videoUrl && <a href={entry.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 underline flex items-center gap-1"><FaVideo /> Video</a>}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {entry.gps && <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><FaMapMarkerAlt /> {entry.gps.lat}, {entry.gps.lng}</span>}
                        {entry.ai != null && <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1"><FaRobot /> AI match {entry.ai}%</span>}
                        {entry.at && <span className="text-[10px] text-gray-400">{timeAgo(entry.at)}</span>}
                        {entry.closes && mProofUrl && <a href={mProofUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 underline flex items-center gap-1"><FaImage /> Milestone proof <FaExternalLinkAlt className="text-[8px]" /></a>}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-2.5">
                    {isDone ? (
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1"><FaLock className="text-[9px]" /> DONE - LOCKED</span>
                    ) : isCurrent ? (
                      <button
                        onClick={() => openStepModal(order, idx)}
                        disabled={!circDone}
                        title={!circDone ? `Complete all ${counter.total} ${counter.noun.toLowerCase()}s first` : 'Open the proof form for this step'}
                        className={`font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-colors ${circDone ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <FaCheckCircle /> {!circDone ? `Complete all ${counter.total} ${counter.noun.toLowerCase()}s first` : 'Complete + Proof'}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1">
                        <FaLock className="text-[9px]" /> Locked — complete Step {firstOpen + 1} first
                      </span>
                    )}
                  </div>
                </div>

                {/* Reference picture per step (click to enlarge) */}
                {g.img && !isLocked && (
                  <a href={g.img} target="_blank" rel="noreferrer" className="inline-flex flex-col items-center flex-shrink-0 group w-24 md:w-28 mt-2">
                    <img src={g.img} alt={`${g.title} reference`} loading="lazy" className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border border-gray-200 shadow-sm group-hover:border-accent group-hover:shadow-md transition-all" />
                    <span className="text-[8px] font-bold text-gray-400 mt-1 flex items-center gap-0.5 group-hover:text-accent transition-colors"><FaExternalLinkAlt className="text-[7px]" /> REFERENCE PIC</span>
                  </a>
                )}
              </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {doneCount === steps.length && steps.length > 0 && (
        <div className="mt-6 bg-[#093527] rounded-xl p-4 flex items-center gap-3 text-white">
          <FaTrophy className="text-2xl text-[#CBA048]" />
          <div>
            <p className="font-semibold">Congratulations! Task Completed!</p>
            <p className="text-xs opacity-80">The order status is now "Completed" and the sponsor can see all your proofs.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const PerformerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => LS.get('user', {}));
  const [profilePic, setProfilePic] = useState(
    LS.get('user', {}).profilePic || localStorage.getItem('performerPic') || ''
  );
  const [allOrders, setAllOrders] = useState([]);
  const [, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const now = useNow(30000); // live tick — refreshes timers, prayer countdown, "assigned X ago"

  // Proof Modal state (step-aware modal)
  const [proofModal, setProofModal] = useState(null); // { orderId, stepIdx, flow, stepKey, serviceType, price, title, msLabel, closes }
  const [proofUrl, setProofUrl] = useState('');       // primary uploaded photo URL (kept for OCR box)
  const [proofSaving, setProofSaving] = useState(false);

  // v6.0 STEP PROOF state (message + multi-photo + receipt + video + AI)
  const [ msgText, setMsgText ] = useState('');
  const [ msgDirty, setMsgDirty ] = useState(false);
  const [ msgFields, setMsgFields ] = useState({});
  const [noteText, setNoteText] = useState('');
  const [proofPhotos, setProofPhotos] = useState([]);     // [{ url, preview }]
  const [receiptState, setReceiptState] = useState(null); // { url, preview }
  const [videoState, setVideoState] = useState(null);     // { url, preview }
  const [aiStatus, setAiStatus] = useState('idle');       // idle | checking | pass | low | skip
  const [aiResult, setAiResult] = useState(null);         // { pct }
  const [logTick, setLogTick] = useState(0);              // refreshes the StepFlow ledger
  const [gpsBypass, setGpsBypass] = useState(false);

  // AUTOMATIC LOCATION state
  const [locStatus, setLocStatus] = useState('idle'); // idle | capturing | captured | error
  const [proofLocation, setProofLocation] = useState(null); // { lat, lng, capturedAt }
  const [showCoords, setShowCoords] = useState(false);

  // ---------- PAGE LOCATION SWITCH (Location on / Location off card) ----------
  // Reads the browser geolocation permission for this site and mirrors it on
  // a small card at the top of the Tasks tab: green "Location on" when the
  // browser grants it, amber "Location off" card with a Try again button when
  // it is blocked or not granted yet (Try again fires the permission prompt).
  const [pageGeo, setPageGeo] = useState('checking'); // checking | on | off
  const checkPageGeo = useCallback((askIfBlocked) => {
    if (!navigator.geolocation) { setPageGeo('off'); return; }
    const ok = () => setPageGeo('on');
    const bad = () => setPageGeo('off');
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((p) => {
        if (p.state === 'granted') {
          navigator.geolocation.getCurrentPosition(ok, bad, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
        } else if (askIfBlocked) {
          navigator.geolocation.getCurrentPosition(ok, bad, { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 });
        } else {
          setPageGeo('off'); // not granted yet -> show the off card with Try again
        }
      }).catch(() => {
        navigator.geolocation.getCurrentPosition(ok, bad, { enableHighAccuracy: false, timeout: 10000, maximumAge: askIfBlocked ? 0 : 60000 });
      });
    } else {
      navigator.geolocation.getCurrentPosition(ok, bad, { enableHighAccuracy: false, timeout: 10000, maximumAge: askIfBlocked ? 0 : 60000 });
    }
  }, []);
  useEffect(() => { checkPageGeo(false); }, [checkPageGeo]);

  // ---------- v7.2 LIVE MAP PAGE (Location button -> separate map page) ----------
  const [ mapOpen, setMapOpen ] = useState(false);
  const [ mapCoords, setMapCoords ] = useState(null); // { lat, lng, acc }
  const [ mapLocating, setMapLocating ] = useState(false);
  const [ mapError, setMapError ] = useState('');
  const fetchMapLocation = useCallback(() => {
    if (!navigator.geolocation) { setMapError('Your browser does not support location.'); return; }
    setMapLocating(true); setMapError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy || 0) });
        setMapLocating(false);
        setPageGeo('on');
      },
      (err) => {
        setMapError(err && err.code === 1
          ? 'Location permission is blocked. Allow location for this site from the browser address bar, then press Retry.'
          : 'Could not read your position. Press Retry.');
        setMapLocating(false);
        setPageGeo('off');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);
  useEffect(() => { if (mapOpen) fetchMapLocation(); }, [ mapOpen, fetchMapLocation ]);

  // OCR PROOF VERIFICATION state
  const [ocrStatus, setOcrStatus] = useState('idle'); // idle | checking | done | skip | error
  const [ocrResult, setOcrResult] = useState(null);   // { text, confidence, matched, score, suggestion }

  // PROFILE SETTINGS state
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', country: '', experience: '' });
  const [picUploading, setPicUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [typeSaving, setTypeSaving] = useState(false);
  const [agencyLoading, setAgencyLoading] = useState(false);

  // PROOF PHOTO UPLOAD state
  const [proofUploading, setProofUploading] = useState(false);
  const [, setProofPreview] = useState('');

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Admin', text: 'Welcome to the IbadahConnect Performer Portal!' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // ===== v4 FEATURES STATE =====
  const [available, setAvailable] = useState(() => LS.get('ic_available', true));
  const [notifs, setNotifs] = useState(() => { const v = LS.get('ic_notifs', []); return Array.isArray(v) ? v : []; });
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // v7.1 — header name menu (old sidebar profile)
  const [payouts, setPayouts] = useState(() => { const v = LS.get('ic_payouts', []); return Array.isArray(v) ? v : []; });
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [wForm, setWForm] = useState({ method: 'Bank Transfer', accName: '', accNo: '', amount: '' });
  const [bank, setBank] = useState(() => { const v = LS.get('ic_bank', { bankName: '', accName: '', accNo: '' }); return (v && typeof v === 'object') ? v : { bankName: '', accName: '', accNo: '' }; });
  const [guideRead, setGuideRead] = useState(() => LS.get('ic_guide_read', false));
  const [streak, setStreak] = useState(() => { const v = LS.get('ic_streak', { last: '', count: 0 }); return (v && typeof v === 'object') ? { last: v.last || '', count: Number(v.count) || 0 } : { last: '', count: 0 }; });
  const [prayerData, setPrayerData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [earnRange, setEarnRange] = useState('week');

  // Scroll refs (Quick Actions)
  const assignedRef = useRef(null);
  const activeRef = useRef(null);
  const requestsRef = useRef(null);

  // ---------- NOTIFICATIONS ----------
  const unreadNotifs = notifs.filter(n => !n.read).length;
  const pushNotif = useCallback((text) => {
    setNotifs(prev => {
      const next = [{ id: Date.now() + Math.random(), text, at: new Date().toISOString(), read: false }, ...prev].slice(0, 30);
      LS.set('ic_notifs', next);
      return next;
    });
  }, []);
  const markNotifsRead = () => setNotifs(prev => { const next = prev.map(n => ({ ...n, read: true })); LS.set('ic_notifs', next); return next; });
  const browserNotif = (title, body) => { try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body }); } catch { /* ignore */ } };

  // ---------- DATA HELPERS ----------
  const performerIdOf = useCallback((o) => (o.performer ? (typeof o.performer === 'object' ? o.performer._id : o.performer) : null), []);
  const isMine = useCallback((o) => performerIdOf(o) === user.id, [performerIdOf, user.id]);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get('/orders/all', { skipAuthRedirect: silent });
      setAllOrders(res.data);
    } catch (err) {
      if (!silent) toast.error('Failed to load tasks. Please check the server.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const timer = setInterval(() => fetchTasks(true), 15000);
    return () => clearInterval(timer);
  }, [fetchTasks]);

  // Load fresh profile from DB on mount
  useEffect(() => {
    if (!user.id || user.id === 'admin_id') return;
    API.get(`/auth/user/${user.id}`).then(res => {
      const u = res.data || {};
      setUser(prev => ({ ...prev, ...u, id: user.id }));
      if (u.profilePic) setProfilePic(u.profilePic);
      setProfileForm({ firstName: u.firstName || '', lastName: u.lastName || '', phone: u.phone || '', country: u.country || '', experience: u.experience || '' });
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...u, id: user.id, token: undefined }));
    }).catch(() => {});
  }, [user.id]);

  // ---------- TODAY'S BRIEFING DATA ----------
  useEffect(() => {
    const dayKey = 'ic_prayer_' + new Date().toISOString().slice(0, 10);
    const cached = LS.get(dayKey, null);
    if (cached) { setPrayerData(cached); }
    else {
      fetch('https://api.aladhan.com/v1/timingsByCity?city=Makkah&country=Saudi%20Arabia&method=4')
        .then(r => r.json())
        .then(j => { if (j && j.data && j.data.timings) { const payload = { timings: j.data.timings, hijri: (j.data.date && j.data.date.hijri) || null }; LS.set(dayKey, payload); setPrayerData(payload); } })
        .catch(() => { /* offline — widget degrades gracefully */ });
    }
    const wc = LS.get('ic_weather', null);
    if (wc && wc.at && Date.now() - wc.at < 2 * 3600 * 1000) { setWeather(wc.data); }
    else {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=21.4225&longitude=39.8262&current=temperature_2m,weather_code')
        .then(r => r.json())
        .then(j => { if (j && j.current) { const d = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code }; LS.set('ic_weather', { at: Date.now(), data: d }); setWeather(d); } })
        .catch(() => { /* offline — widget degrades gracefully */ });
    }
  }, []);

  // ---------- DAILY STREAK TRACKER ----------
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    setStreak(prev => {
      if (prev.last === today) return prev;
      const next = { last: today, count: prev.last === yest ? prev.count + 1 : 1 };
      LS.set('ic_streak', next);
      return next;
    });
  }, []);

  // ---------- DERIVED DATA (from real DB) ----------
  const myAssigned = allOrders.find(o => isMine(o) && o.status === 'Assigned');
  const myActive = allOrders.find(o => isMine(o) && o.status === 'In Progress');
  const myCompleted = allOrders.filter(o => isMine(o) && o.status === 'Completed');
  const newRequests = allOrders.filter(o => o.status === 'Pending');
  const isBusy = !!(myAssigned || myActive);
  const acceptingTasks = available && !isBusy;

  const PRICE_HIDDEN = 'Price Hidden — Rules & Regulations Apply';
  const performerType = user.performerType || 'Ibadah Team';
  const agencyConnect = user.agencyConnect || 'None';

  // ---------- POINTS + LEVEL + PAYOUT TIER ----------
  const onTimeCount = myCompleted.filter(o => { const t = new Date(o.updatedAt) - new Date(o.createdAt); return t > 0 && t <= 24 * 3600 * 1000; }).length;
  const allMy = allOrders.filter(o => isMine(o));
  let gpsProofs = 0, aiProofs = 0, doneProofs = 0;
  allMy.forEach(o => (o.milestones || []).forEach(m => {
    if (isMilestoneCompleted(m)) { doneProofs++; if (m.proofLocation) gpsProofs++; if (m.proofOcr && m.proofOcr.suggestion === 'verified') aiProofs++; }
  }));
  const fiveStarCount = myCompleted.filter(o => ((o.feedback && o.feedback.rating) || o.rating || 0) === 5).length;
  const totalPoints = myCompleted.length * 100 + onTimeCount * 50 + fiveStarCount * 30 + aiProofs * 20 + (guideRead ? 40 : 0) + (streak.count >= 7 ? 50 : 0);
  const lvlIdx = levelOf(totalPoints);
  const lvl = LEVELS[lvlIdx];
  const nextLvl = LEVELS[lvlIdx + 1] || null;
  const lvlProgress = nextLvl ? Math.min(100, Math.round(((totalPoints - lvl.min) / (nextLvl.min - lvl.min)) * 100)) : 100;
  const SHARE = lvlIdx >= 2 ? 0.88 : 0.85;
  const earnOf = useCallback((o) => Math.round((o.price || 0) * SHARE), [SHARE]);
  const queuePos = [4, 3, 2, 1][lvlIdx];
  const etaText = lvlIdx >= 2 ? '~1 hour' : '~2 hours';

  const totalEarnings = myCompleted.filter(o => !isDonation(o)).reduce((sum, o) => sum + earnOf(o), 0);
  const pendingEarnings = myActive && !isDonation(myActive) ? earnOf(myActive) : 0;

  // ---------- PERFORMANCE SCORE ----------
  const ratings = myCompleted.map(o => (o.feedback && o.feedback.rating) || o.rating || null).filter(Boolean);
  const ratingAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const perfParts = [];
  if (ratingAvg != null) perfParts.push((ratingAvg / 5) * 100);
  if (myCompleted.length) perfParts.push((onTimeCount / myCompleted.length) * 100);
  if (doneProofs > 0) perfParts.push((aiProofs / doneProofs) * 100);
  const perfScore = perfParts.length ? Math.round(perfParts.reduce((a, b) => a + b, 0) / perfParts.length) : null;
  const perfLabel = perfScore == null ? '' : perfScore >= 90 ? 'Excellent' : perfScore >= 75 ? 'Good' : perfScore >= 60 ? 'Building up' : 'Getting started';

  // ---------- PROFILE COMPLETION METER ----------
  const profileChecks = [
    { label: 'CNIC Verified', done: !!user.isVerified, icon: FaIdCard, hint: 'CNIC verification is completed by Admin during onboarding.' },
    { label: 'Profile Photo', done: !!profilePic, icon: FaCamera, hint: 'Upload your photo from the Profile & Stats tab.' },
    { label: 'Bank / Payout Details', done: !!(bank.accName && bank.accNo), icon: FaUniversity, hint: 'Add your bank details in Profile & Stats — required for payouts.' },
    { label: 'Guide Read', done: guideRead, icon: FaQuran, hint: 'Open Rules & Regulations to complete the guide (+40 points).' },
  ];
  const profilePct = Math.round((profileChecks.filter(c => c.done).length / profileChecks.length) * 100);
  const nextProfileHint = (profileChecks.find(c => !c.done) || {}).hint || '';

  // ---------- EARNINGS CHART DATA ----------
  const chartData = useMemo(() => {
    const buckets = [];
    const n = new Date();
    if (earnRange === 'week') {
      for (let i = 7; i >= 0; i--) {
        const end = new Date(n); end.setHours(23, 59, 59, 999); end.setDate(end.getDate() - i * 7);
        const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
        const sum = myCompleted.filter(o => { const d = new Date(o.updatedAt); return d >= start && d <= end && !isDonation(o); }).reduce((s, o) => s + earnOf(o), 0);
        buckets.push({ label: `${start.getDate()}/${start.getMonth() + 1}`, sum });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const start = new Date(n.getFullYear(), n.getMonth() - i, 1);
        const end = new Date(n.getFullYear(), n.getMonth() - i + 1, 0, 23, 59, 59);
        const sum = myCompleted.filter(o => { const d = new Date(o.updatedAt); return d >= start && d <= end && !isDonation(o); }).reduce((s, o) => s + earnOf(o), 0);
        buckets.push({ label: start.toLocaleString('en', { month: 'short' }), sum });
      }
    }
    return buckets;
  }, [earnRange, earnOf, myCompleted]);

  // ---------- PAYOUT BALANCE ----------
  const withdrawnTotal = payouts.filter(p => p.status !== 'Rejected').reduce((s, p) => s + (p.amount || 0), 0);
  const availableBalance = Math.max(0, totalEarnings - withdrawnTotal);

  // ---------- BADGES ----------
  const badges = [
    { id: 'first', name: 'First Ibadah', desc: 'Complete your first task', icon: FaMosque, have: myCompleted.length >= 1, prog: `${Math.min(myCompleted.length, 1)}/1` },
    { id: 'ten', name: '10x Performer', desc: 'Complete 10 tasks', icon: FaFire, have: myCompleted.length >= 10, prog: `${Math.min(myCompleted.length, 10)}/10` },
    { id: 'speed', name: 'Speed Scholar', desc: '5 on-time completions (24h)', icon: FaBolt, have: onTimeCount >= 5, prog: `${Math.min(onTimeCount, 5)}/5` },
    { id: 'stars', name: 'Five Star', desc: '10 five-star sponsor feedbacks', icon: FaStar, have: fiveStarCount >= 10, prog: `${Math.min(fiveStarCount, 10)}/10` },
    { id: 'ramadan', name: 'Ramadan Warrior', desc: '10 tasks during Ramadan season', icon: FaMoon, have: prayerData && prayerData.hijri && prayerData.hijri.month && prayerData.hijri.month.number === 9 && myCompleted.length >= 10, prog: prayerData && prayerData.hijri && prayerData.hijri.month && prayerData.hijri.month.number === 9 ? `${Math.min(myCompleted.length, 10)}/10` : 'Seasonal' },
    { id: 'gps', name: 'GPS Perfect', desc: '20 location-verified proofs', icon: FaMapMarkerAlt, have: gpsProofs >= 20, prog: `${Math.min(gpsProofs, 20)}/20` },
  ];

  // ---------- LEADERBOARD ----------
  const leaderboard = useMemo(() => {
    const map = {};
    allOrders.filter(o => o.status === 'Completed' && o.performer && typeof o.performer === 'object').forEach(o => {
      const p = o.performer;
      if (!map[p._id]) map[p._id] = { id: p._id, name: `${p.firstName || 'Performer'} ${p.lastName || ''}`.trim(), month: 0, total: 0 };
      map[p._id].total += 1;
      const d = new Date(o.updatedAt), t = new Date();
      if (d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()) map[p._id].month += 1;
    });
    return Object.values(map).sort((a, b) => b.month - a.month || b.total - a.total).slice(0, 5);
  }, [allOrders]);

  // ---------- NEW TASK ASSIGNMENT DETECTOR ----------
  const seenAssignedRef = useRef(null);
  useEffect(() => {
    if (!myAssigned) return;
    if (seenAssignedRef.current === myAssigned._id) return;
    const first = seenAssignedRef.current === null;
    seenAssignedRef.current = myAssigned._id;
    // v8.0: neutral wording — orders v2 auto-assigns Pending requests the
    // moment they are booked, so the task may arrive without any admin tap.
    const text = `New task assigned: ${taskTitle(myAssigned)} (${orderCode(myAssigned)})`;
    pushNotif(text);
    toast.success(first ? 'You have an assigned task — press Start Task.' : 'New task assigned: ' + taskTitle(myAssigned));
    browserNotif('IbadahConnect — New Task', text);
  }, [myAssigned, pushNotif]);
  // ---------- v8.0 SPONSOR GLITCH DIAGNOSTIC (one console warning) ----------
  // If a task owned by this performer carries the performer's own id inside
  // the sponsor field, the DB record is crossed — an outdated backend wrote
  // the wrong field. The UI hides the wrong name; this warning now points to
  // the delivered orders-v2.js, which fixes the sponsor name at the source.
  const warnedSponsorRef = useRef(false);
  useEffect(() => {
    if (!SPONSOR_DEBUG || warnedSponsorRef.current) return;
    const bad = allOrders.find(o => {
      if (!isMine(o)) return false;
      const s = sponsorObjOf(o);
      const sid = sponsorIdOf(s);
      return !!(sid && String(sid) === String(user.id || ''));
    });
    if (bad) {
      warnedSponsorRef.current = true;
      console.warn('[PerformerDashboard] Order ' + bad._id + ' has sponsor == the logged-in performer. Your backend/routes/orders.js is outdated — paste the delivered orders-v2.js (v2): it sets order.performer only on accept-task and computes sponsorName server-side on every response. Until then this dashboard hides the wrong name.');
    }
  }, [allOrders, isMine, user.id]);

  // ---------- AVAILABILITY TOGGLE ----------
  const handleToggleAvailability = () => {
    if (isBusy) { toast('Status stays Busy until your active task is finished.'); return; }
    const next = !available;
    setAvailable(next); LS.set('ic_available', next);
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch { /* ignore */ }
    API.put(`/auth/user/${user.id}`, { availability: next }).catch(() => {});
    toast.success(next ? 'You are now Available — new requests can reach you.' : 'You are now Busy — new assignments paused.');
    pushNotif(next ? 'Availability turned ON — you can receive new tasks.' : 'Availability turned OFF — assignments paused.');
  };

  // ---------- FRIENDLY SERVER ERRORS ----------
  const serverMsg = (err, fallback) => {
    if (err && err.response && err.response.status === 404) return 'Server route missing - your backend routes/auth.js is outdated. Paste the latest backend file.';
    return (err.response && err.response.data && err.response.data.message) || fallback;
  };

  // ---------- ACTIONS ----------
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartTask = async (orderId) => {
    try {
      const res = await API.put(`/orders/accept-task/${orderId}`, { performerId: user.id });
      toast.success(res.data.message || 'Task started! Step 1 is now unlocked — one step at a time.');
      const o = allOrders.find(x => x._id === orderId);
      pushNotif(`Task started: ${o ? taskTitle(o) : 'task'}`);
      browserNotif('IbadahConnect — Task Started', 'Step 1 unlocked. Complete it with proof to unlock Step 2.');
      await fetchTasks(true);
    } catch (err) {
      toast.error((err.response && err.response.data && err.response.data.message) || 'Error starting task.');
      // v8.0 race-safe UX: if another performer claimed this request first,
      // refresh at once so it disappears from New Requests immediately.
      if (err && err.response && err.response.status === 400) fetchTasks(true);
    }
  };

  // ---------- v6.0 STEP MODAL (replaces the old milestone modal) ----------
  const openStepModal = (order, stepIdx) => {
    const flow = flowOf(order);
    const steps = flowStepLib(flow);
    const st = steps[stepIdx];
    if (!st) return;
    setProofPhotos([]); setReceiptState(null); setVideoState(null);
    setMsgDirty(false); setMsgText(''); setNoteText('');
    setMsgFields(defaultMsgFields(order, st, user));
    setAiStatus('idle'); setAiResult(null);
    setProofUrl(''); setProofPreview(''); setOcrStatus('idle'); setOcrResult(null);
    setShowCoords(false); setGpsBypass(false);
    const msArr = order.milestones || [];
    const msLabel = msArr[st.msIdx] ? stepText(msArr[st.msIdx].step !== undefined ? msArr[st.msIdx].step : msArr[st.msIdx]) : '';
    setProofModal({ orderId: order._id, stepIdx, flow, stepKey: st.key, serviceType: order.serviceType, price: order.price, title: taskTitle(order), msLabel, closes: !!st.closes });
  };

  const quickUploadProof = () => {
    if (!myActive) { toast('Start a task first — proof upload unlocks after starting.'); return; }
    const steps = flowStepLib(flowOf(myActive));
    const ledger = loadLedger(myActive._id);
    const idx = steps.findIndex((_, i) => !stepDone(myActive, steps, i, ledger));
    if (idx === -1) { toast('All steps are already submitted.'); return; }
    openStepModal(myActive, idx);
  };
  const markGuideRead = () => {
    if (!guideRead) { setGuideRead(true); LS.set('ic_guide_read', true); toast.success('Guide marked as read (+40 points).'); }
  };

  // ---------- PAYOUT / WITHDRAWAL ----------
  const submitWithdraw = () => {
    const amt = Math.round(Number(wForm.amount));
    if (!wForm.accName.trim() || !wForm.accNo.trim()) { toast.error('Account name and account number are required.'); return; }
    if (!amt || amt < 500) { toast.error('Minimum withdrawal is PKR 500.'); return; }
    if (amt > availableBalance) { toast.error('Amount exceeds your available balance.'); return; }
    const p = { id: Date.now(), at: new Date().toISOString(), method: wForm.method, accName: wForm.accName.trim(), accNo: wForm.accNo.trim(), amount: amt, status: 'Pending' };
    const next = [p, ...payouts];
    setPayouts(next); LS.set('ic_payouts', next);
    setWithdrawOpen(false);
    setWForm({ method: 'Bank Transfer', accName: '', accNo: '', amount: '' });
    toast.success('Withdrawal request submitted — Admin processes payouts within 48 hours.');
    pushNotif(`Withdrawal requested: PKR ${amt.toLocaleString()} via ${p.method}.`);
  };
  const openWithdraw = () => {
    setWForm(w => ({ ...w, accName: bank.accName || '', accNo: bank.accNo || '' }));
    if (!(bank.accName && bank.accNo)) toast('Tip: save your bank details in Profile & Stats first — they auto-fill here.');
    setWithdrawOpen(true);
  };

  // ---------- BANK / PAYOUT DETAILS ----------
  const saveBank = () => {
    if (!bank.accName.trim() || !bank.accNo.trim()) { toast.error('Account name and account number are required.'); return; }
    LS.set('ic_bank', bank);
    toast.success('Payout details saved on this device.');
  };

  // ---------- PROFILE PIC UPLOAD ----------
  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be smaller than 8MB.'); return; }
    setPicUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await API.post('/upload/profile-pic', fd);
      const saved = await API.put(`/auth/user/${user.id}`, { profilePic: up.data.url });
      const updatedUser = saved.data.user || {};
      setProfilePic(up.data.url);
      setUser(prev => ({ ...prev, ...updatedUser, id: user.id }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...updatedUser, id: user.id }));
      localStorage.setItem('performerPic', up.data.url);
      toast.success('Profile picture saved!');
    } catch (err) {
      toast.error(serverMsg(err, 'Profile picture upload failed.'));
    } finally {
      setPicUploading(false);
      e.target.value = '';
    }
  };

  // ---------- PROFILE INFO SAVE ----------
  const handleProfileSave = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First and Last name are required.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await API.put(`/auth/user/${user.id}`, {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
        country: profileForm.country.trim(),
        experience: profileForm.experience || ''
      });
      const updatedUser = res.data.user || {};
      setUser(prev => ({ ...prev, ...updatedUser, id: user.id }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...updatedUser, id: user.id }));
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(serverMsg(err, 'Failed to save profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- PERFORMER TYPE CHANGE ----------
  const handleTypeChange = async (newType) => {
    if (newType === performerType) return;
    setTypeSaving(true);
    try {
      await API.put(`/auth/user/${user.id}`, { performerType: newType });
      const updated = { performerType: newType };
      setUser(prev => ({ ...prev, ...updated }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...updated }));
      toast.success(newType === 'Ibadah Team' ? 'Performer type set to Ibadah Team.' : 'Performer type set to Self/Family.');
    } catch (err) {
      toast.error(serverMsg(err, 'Failed to change type.'));
    } finally {
      setTypeSaving(false);
    }
  };

  // ---------- AGENCY CONNECT REQUEST ----------
  const handleAgencyRequest = async () => {
    setAgencyLoading(true);
    try {
      const res = await API.post('/auth/agency-request');
      const updated = { agencyConnect: 'Requested' };
      setUser(prev => ({ ...prev, ...updated }));
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), ...updated }));
      toast.success(res.data.message || 'Request sent!');
    } catch (err) {
      toast.error((err.response && err.response.data && err.response.data.message) || 'Request failed.');
    } finally {
      setAgencyLoading(false);
    }
  };

  // ---------- PASSWORD CHANGE ----------
  const handlePasswordSave = async () => {
    if (!pwForm.current || !pwForm.next) { toast.error('Please enter both the current and the new password.'); return; }
    if (pwForm.next !== pwForm.confirm) { toast.error('New password and confirmation do not match.'); return; }
    if (pwForm.next.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    setSavingProfile(true);
    try {
      await API.put(`/auth/user/${user.id}`, { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(serverMsg(err, 'Failed to change password.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- v6.0 PROOF UPLOADS (multi-photo + receipt + video) ----------
  const uploadOne = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const up = await API.post('/upload/proof', fd);
    return up.data.url;
  };

  const handleProofPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const room = Math.max(0, 6 - proofPhotos.length);
    const take = files.slice(0, room);
    if (!take.length) { toast.error('Maximum 6 photos per step.'); return; }
    setProofUploading(true);
    try {
      const added = [];
      for (const file of take) {
        if (file.size > 8 * 1024 * 1024) { toast.error(`${file.name} is larger than 8MB — skipped.`); continue; }
        const url = await uploadOne(file);
        added.push({ url, preview: url });
      }
      if (added.length) {
        const isFirst = proofPhotos.length === 0;
        setProofPhotos(prev => [...prev, ...added]);
        setProofUrl(added[0].url);
        setProofPreview(added[0].url);
        toast.success('Photo uploaded — starting AI reference check...');
        if (isFirst) await runAiMatch(added[0].url);
      }
    } catch (err) {
      toast.error((err.response && err.response.data && err.response.data.message) || 'Photo upload failed.');
    } finally {
      setProofUploading(false);
    }
  };

  const handleReceiptFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Receipt must be smaller than 8MB.'); return; }
    setProofUploading(true);
    try {
      const url = await uploadOne(file);
      setReceiptState({ url, preview: url });
      toast.success('Receipt uploaded.');
    } catch (err) {
      toast.error((err.response && err.response.data && err.response.data.message) || 'Receipt upload failed.');
    } finally {
      setProofUploading(false);
    }
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('Video must be smaller than 50MB — record a shorter clip.'); return; }
    setProofUploading(true);
    try {
      const url = await uploadOne(file);
      setVideoState({ url, preview: '' });
      toast.success('Video uploaded.');
    } catch (err) {
      toast.error((err.response && err.response.data && err.response.data.message) || 'Video upload failed — try a smaller file.');
    } finally {
      setProofUploading(false);
    }
  };

  // AUTOMATIC LOCATION: capture GPS as soon as the step modal opens
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
          setPageGeo('on'); // a working GPS fix means location is really on
        },
        () => setLocStatus('error'),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, [proofModal]);

  const retryLocation = () => {
    setLocStatus('capturing');
    setProofLocation(null);
    if (!navigator.geolocation) { setLocStatus('error'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProofLocation({
          lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
          lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
          capturedAt: new Date().toISOString()
        });
        setLocStatus('captured');
        setPageGeo('on');
      },
      () => setLocStatus('error'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // ---------- AI REFERENCE MATCH (60%+ locks the step) ----------
  const looksLikeImage = (url) => /\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url) || url.startsWith('/uploads/') || url.startsWith('data:image');

  const runAiMatch = async (url) => {
    if (!url || !looksLikeImage(url)) { setAiStatus('skip'); return; }
    setAiStatus('checking');
    try {
      const res = await API.post('/proof/ai-match', {
        proofUrl: url,
        reference: `${proofModal && proofModal.flow}-${proofModal && proofModal.stepKey}`,
        serviceType: (proofModal && proofModal.serviceType) || ''
      });
      if (res.data?.available === false) {
        setAiStatus('skip');
        setAiResult(null);
        toast(res.data.message || 'AI reference matching is unavailable. This proof will be reviewed manually.');
        return;
      }
      const raw = res.data && (res.data.matchPercent != null ? res.data.matchPercent : res.data.score);
      const pct = Number(raw);
      if (!Number.isFinite(pct)) { setAiStatus('skip'); setAiResult(null); return; }
      const rounded = Math.round(pct);
      setAiResult({ pct: rounded });
      setAiStatus(rounded >= AI_MATCH_MIN ? 'pass' : 'low');
      if (rounded >= AI_MATCH_MIN) toast.success(`AI reference check passed — ${rounded}% match.`);
      else toast.error(`AI match ${rounded}% — needs ${AI_MATCH_MIN}%. Retake a clearer photo like the reference pic.`);
    } catch {
      // AI route offline — degrade gracefully, never brick the flow
      setAiStatus('skip');
      setAiResult(null);
    }
  };

  // OCR receipt check (kept from v5.0 — runs on the first uploaded photo)
  const runOcrCheck = useCallback(async (url) => {
    if (!url || !looksLikeImage(url)) return;
    setOcrStatus('checking');
    try {
      const res = await API.post('/proof/ocr-check', {
        proofUrl: url,
        serviceType: (proofModal && proofModal.serviceType) || '',
        amount: proofModal && !isDonation(proofModal) ? proofModal.price : undefined
      });
      setOcrResult(res.data.ocr || null);
      setOcrStatus(res.data.skippable ? 'skip' : 'done');
      if (res.data.skippable) toast(res.data.message);
    } catch {
      setOcrStatus('error');
    }
  }, [proofModal]);

  useEffect(() => {
    if (!proofModal) return;
    const first = proofPhotos[0] && proofPhotos[0].url;
    if (!first || !looksLikeImage(first)) return;
    const t = setTimeout(() => runOcrCheck(first), 700);
    return () => clearTimeout(t);
  }, [proofPhotos, proofModal, runOcrCheck]);

  // ---------- v6.0 SUBMIT STEP ----------
  const submitStep = async () => {
    if (!proofModal) return;
    const order = allOrders.find(x => x._id === proofModal.orderId);
    const steps = flowStepLib(proofModal.flow);
    const st = steps[proofModal.stepIdx];
    if (!st) return;
    const need = st.need || {};
    const msg = (msgDirty ? msgText : (st.msgTpl ? st.msgTpl(msgFields) : '')).trim();

    if (need.msg && !msg) { toast.error('Type the message first — it is shown to the sponsor.'); return; }
    if (need.photos && proofPhotos.length < need.photos) { toast.error(`Upload at least ${need.photos} photo(s).`); return; }
    if (need.receipt && !receiptState) { toast.error('Upload the purchase receipt photo.'); return; }
    if (need.video && !videoState) { toast.error('Record and upload the video proof.'); return; }
    if (need.counter) {
      const ckey = `ic_circ_${proofModal.orderId}_${proofModal.stepIdx}`;
      if ((Number(LS.get(ckey, 0)) || 0) < need.counter.total) { toast.error(`Counter incomplete — complete all ${need.counter.total} ${need.counter.noun.toLowerCase()}s first.`); return; }
    }
    if (need.gps && !proofLocation && !gpsBypass) { toast.error('Location is required for this step — allow GPS access or continue without location below.'); return; }
    if (proofUploading || aiStatus === 'checking') { toast.error('Uploads / AI check still in progress — wait a moment.'); return; }
    if (aiStatus === 'low') { toast.error(`AI match ${aiResult.pct}% is below ${AI_MATCH_MIN}% — retake a clearer photo like the reference pic.`); return; }

    setProofSaving(true);
    try {
      const gpsOk = !!(proofLocation && Number.isFinite(proofLocation.lat));
      const addrParts = [];
      if (msg) addrParts.push(msg);
      if (noteText.trim()) addrParts.push(noteText.trim());
      // The message travels with the milestone location to the tracking page.
      const proofLocationPayload = gpsOk
        ? { lat: proofLocation.lat, lng: proofLocation.lng, capturedAt: proofLocation.capturedAt, address: addrParts.join(' | ') || 'GPS verified proof' }
        : (addrParts.length ? { address: addrParts.join(' | ') } : undefined);

      let res = null;
      if (st.closes) {
        const msTotal = ((order && order.milestones) || []).length;
        const msTarget = Math.min(st.msIdx, Math.max(0, msTotal - 1));
        const primary = (videoState && videoState.url) || (proofPhotos[0] && proofPhotos[0].url) || proofUrl || '';
        res = await API.put(`/orders/update-milestone/${proofModal.orderId}`, {
          milestoneIndex: msTarget,
          proofUrl: primary,
          proofLocation: proofLocationPayload,
          proofOcr: (aiResult && { suggestion: 'verified', score: aiResult.pct, confidence: aiResult.pct, matched: ['AI reference match'] }) || (ocrStatus === 'done' && ocrResult) || undefined
        });
      }

      saveLedgerEntry(proofModal.orderId, {
        idx: proofModal.stepIdx,
        key: st.key,
        title: st.title,
        msg,
        note: noteText.trim(),
        urls: proofPhotos.map(p => p.url),
        receiptUrl: receiptState ? receiptState.url : '',
        videoUrl: videoState ? videoState.url : '',
        gps: gpsOk ? { lat: proofLocation.lat, lng: proofLocation.lng } : null,
        at: new Date().toISOString(),
        ai: aiResult ? aiResult.pct : null,
        msIdx: st.msIdx,
        closes: !!st.closes
      });
      setLogTick(v => v + 1);
      setProofModal(null);

      if (st.closes && res) {
        if (res.data.orderCompleted) {
          toast.success('Congratulations! All milestones complete — order status is now Completed!', { duration: 5000 });
          pushNotif('All milestones complete — task marked Completed. Certificate unlocked for the sponsor.');
          browserNotif('IbadahConnect — Task Completed', 'All milestones verified. JazakAllah Khair!');
        } else {
          toast.success(`Step complete! Milestone ${res.data.completedMilestones}/${res.data.totalMilestones} — proof sent to the sponsor tracking page.`);
          pushNotif(`Step completed: ${st.title} — proof sent to the sponsor tracking page.`);
        }
      } else {
        toast.success('Step saved — it is delivered to the sponsor together with its milestone proof.');
        pushNotif(`Step completed: ${st.title}.`);
      }
      await fetchTasks(true);
    } catch (err) {
      toast.error('Error submitting the step. Please try again.');
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
      setChatMessages(prev => [...prev, { sender: 'Admin', text: 'Noted. JazakAllah Khair!' }]);
    }, 1500);
  };

  const menuItems = [
    { id: 'tasks', icon: <FaTasks />, label: 'Dashboard' },
    { id: 'history', icon: <FaHistory />, label: 'History' },
    { id: 'feedbacks', icon: <FaRegComment />, label: 'Feedbacks' },
    { id: 'earnings', icon: <FaWallet />, label: 'Earnings' },
    { id: 'settings', icon: <FaCog />, label: 'Profile & Stats' },
  ];

  // ---------- v6.0 MODAL DERIVED ----------
  const modalStep = proofModal ? flowStepLib(proofModal.flow)[proofModal.stepIdx] : null;
  const modalNeed = modalStep ? (modalStep.need || {}) : {};
  const modalMsgValue = modalStep && modalStep.msgTpl ? (msgDirty ? msgText : modalStep.msgTpl(msgFields)) : '';

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#2A332E] ibd-pro pb-20 md:pb-0 flex flex-col">
      <style>{FONT_CSS}</style>

      {/* ============ HEADER (same logo & colour scheme as the main website) ============ */}
      <header className="bg-white border-b border-[#E5E9E4] sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')} title="Go to main website">
            <svg className="w-8 h-8" viewBox="0 0 100 100">
              <polygon points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35" fill="#1B5E20" stroke="#D4AF37" strokeWidth="5"/>
              <path d="M35 70 Q50 35 65 70 Z" fill="#D4AF37" />
              <rect x="35" y="65" width="30" height="10" fill="#D4AF37" />
              <rect x="25" y="50" width="6" height="25" fill="#D4AF37" />
              <circle cx="28" cy="48" r="4" fill="#D4AF37" />
              <rect x="69" y="50" width="6" height="25" fill="#D4AF37" />
              <circle cx="72" cy="48" r="4" fill="#D4AF37" />
            </svg>
            <div className="leading-none hidden sm:block">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-wide" style={{ fontFamily: 'Amiri, serif' }}>
                <span style={{ color: '#1B5E20' }}>Ibadah</span><span style={{ color: '#D4AF37' }}>Connect</span>
              </h1>
              <p className="text-[8px] font-bold tracking-[0.3em] text-gray-400 uppercase mt-1">Performer Portal</p>
            </div>
          </div>

          {/* ===== v7.6 SEARCH (Stitch mockup: center search box, filters new requests) ===== */}
          <div className="hidden md:flex flex-1 justify-center px-2">
            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B9890] text-sm" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full bg-[#F4F7F4] border border-transparent focus:border-[#0F4D38]/30 focus:bg-white rounded-full pl-10 pr-4 py-2 text-sm text-[#18261F] placeholder-[#8B9890] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-sm text-[#2F3731]">
              <span className={`w-2 h-2 rounded-full ${acceptingTasks ? 'bg-[#257657]' : 'bg-[#C68520]'} ${isBusy ? '' : 'animate-pulse'}`}></span>
              {acceptingTasks ? 'Available' : isBusy ? 'Busy' : 'Unavailable'}
            </span>
            <button onClick={() => window.location.reload()} title="Refresh data" className="text-[#48534C] hover:text-[#0F4D38] p-2 transition-colors">
              <FaSyncAlt />
            </button>
            <div className="relative">
              <button onClick={() => { setNotifOpen(v => !v); if (!notifOpen) markNotifsRead(); setProfileOpen(false); }} title="Notifications" className="relative text-base text-[#48534C] hover:text-[#0F4D38] p-2 transition-colors">
                <FaBell />
                {unreadNotifs > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] bg-[#C68520] rounded-full border-2 border-white text-[9px] flex items-center justify-center font-bold text-white px-0.5">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Notifications</p>
                    <button onClick={markNotifsRead} className="text-[10px] font-bold text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifs.length === 0 ? (
                      <p className="p-6 text-center text-xs text-gray-400">No notifications yet. Task events will appear here.</p>
                    ) : notifs.map(n => (
                      <div key={n.id} className="px-4 py-2.5 flex gap-2.5 hover:bg-gray-50">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-gray-200' : 'bg-primary'}`}></span>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">{n.text}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{timeAgo(n.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setIsChatOpen(true)} className="text-sm text-[#48534C] hover:text-[#0F4D38] px-1 py-2 hidden md:flex items-center gap-1.5 transition-colors">
              <FaCommentDots /> Live chat
            </button>
            {/* ===== v7.1 PROFILE NAME MENU (old left sidebar now opens here) ===== */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                className="flex items-center gap-2.5 pl-1 pr-2.5 py-1.5 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all"
                title="Your profile"
              >
                {profilePic ? (
                  <img src={profilePic} alt="Me" className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[#0F4D38] text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0">
                    {user && user.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
                  </span>
                )}
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-extrabold text-[#18261F] max-w-[130px] truncate">{user && user.firstName} {user && user.lastName}</span>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#69786F]">{user && user.isVerified ? 'Verified Performer' : 'Verification pending'}</span>
                </span>
                <FaChevronDown className={`text-[10px] text-[#69786F] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-11 h-11 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-[#0F4D38] flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                          {user && user.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#18261F] truncate">{user && user.firstName} {user && user.lastName}</p>
                        <p className="text-[10px] text-[#69786F] flex items-center gap-1 mt-0.5">
                          {user && user.isVerified ? <><FaUserCheck className="text-[#257657]" /> Verified Performer</> : 'Verification pending'}
                        </p>
                      </div>
                    </div>
                    {/* v8.1: name + portal menu only — availability and profile strength moved to the Profile & Stats tab */}
                    <div className="p-2 overflow-y-auto">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#69786F] px-3 pt-1.5 pb-1.5">Portal menu</p>
                        {menuItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => { setProfileOpen(false); setActiveTab(item.id); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${activeTab === item.id ? 'text-[#0F4D38] bg-gray-50' : 'text-[#2A332E] hover:bg-gray-50'}`}
                          >
                            {item.icon} {item.label}
                          </button>
                        ))}
                        <button
                          onClick={() => { setProfileOpen(false); markGuideRead(); navigate('/performer-rules'); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold text-[#2A332E] hover:bg-gray-50 transition-colors"
                        >
                          <FaScroll /> Rules &amp; Regulations
                        </button>
                      </div>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <FaSignOutAlt /> Log out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1240px] mx-auto py-6 px-4">

        {/* ================= MAIN CONTENT (Stitch mockup: 8/4 grid) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <main className={`${activeTab === 'tasks' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>

          {activeTab === 'tasks' && (
            <>
              {/* ===== PAGE HEADER (mockup: serif display + status dot) ===== */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="font-serif text-4xl md:text-[42px] leading-tight text-[#163D2E] font-normal">Active task</h1>
                  <p className="text-sm text-[#55635B] mt-1">
                    Assalamu alaikum, {user && user.firstName}. {myActive ? 'Finish each step with proof to unlock the next.' : myAssigned ? 'You have an assigned task — press Start Task to unlock Step 1.' : acceptingTasks ? 'You are available — new requests appear below.' : 'You are marked Busy — open Profile & Stats to switch availability.'}
                  </p>
                </div>
                <div className="mt-1 md:mt-0 flex items-center gap-2 text-sm text-[#38423C] flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${myActive ? 'bg-[#C68520]' : acceptingTasks ? 'bg-[#257657]' : 'bg-[#C68520]'}`}></span>
                  <span>{myActive ? 'In progress' : acceptingTasks ? 'Available' : isBusy ? 'Busy' : 'Unavailable'}</span>
                </div>
              </div>

              {/* ===== v7.6 LOCATION BANNER (Stitch mockup: toggle + text + Try again; toggle opens the full-page map) ===== */}
              <div className={`flex items-center gap-3.5 rounded-xl border px-4 py-3 ${pageGeo === 'on' ? 'bg-[#F4F7F4] border-[#DCE4DC]' : 'bg-white border-[#E3E8E3]'}`}>
                <button
                  onClick={() => setMapOpen(true)}
                  title="Open your live location map on a separate page"
                  className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors ${pageGeo === 'on' ? 'bg-[#0F4D38]' : 'bg-[#C9D2CA]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${pageGeo === 'on' ? 'left-[22px]' : 'left-0.5'}`}></span>
                </button>
                <p className="text-[13px] leading-snug text-[#38423C] min-w-0">
                  <span className="font-bold text-[#18261F]">{pageGeo === 'checking' ? 'Checking location…' : pageGeo === 'on' ? 'Location on' : 'Location off'}</span>
                  {' — '}{pageGeo === 'on' ? 'your GPS pin is live; tap the switch to open your map page.' : 'Your browser is blocking location — allow Location access for this site, then try again.'}
                </p>
                {pageGeo !== 'on' && (
                  <button onClick={() => checkPageGeo(true)} className="ml-auto flex-shrink-0 text-sm font-bold text-[#257657] hover:text-[#0F4D38] transition-colors">Try again</button>
                )}
              </div>

              {/* ===== ASSIGNED BY / ON / AT (mockup metadata row) ===== */}
              {(myActive || myAssigned) && (myActive || myAssigned).createdAt && (() => {
                const metaSrc = myActive || myAssigned;
                const metaDate = new Date(metaSrc.createdAt);
                return (
                  <section className="grid grid-cols-1 md:grid-cols-3 border-b border-[#E3E8E3] pb-6">
                    <div className="border-b md:border-b-0 md:border-r border-[#E3E8E3] pb-3 md:pb-0 md:pr-6">
                      <span className="text-xs uppercase tracking-wider text-[#69786F] block mb-1">Assigned by</span>
                      <span className="font-serif text-2xl md:text-[28px] text-[#132C22] leading-none">Admin</span>
                    </div>
                    <div className="border-b md:border-b-0 md:border-r border-[#E3E8E3] py-3 md:py-0 md:px-8">
                      <span className="text-xs uppercase tracking-wider text-[#69786F] block mb-1">Assigned on</span>
                      <span className="font-serif text-2xl md:text-[28px] text-[#132C22] leading-none">{metaDate.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="pt-3 md:pt-0 md:pl-8">
                      <span className="text-xs uppercase tracking-wider text-[#69786F] block mb-1">Assigned at</span>
                      <span className="font-serif text-2xl md:text-[28px] text-[#132C22] leading-none">{metaDate.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  </section>
                );
              })()}

              {/* ===== ASSIGNED TASK (Purple Card + Start Task) ===== */}
              {myAssigned && (
                <article ref={assignedRef} className="bg-white border border-[#E1E7E1] rounded-xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-[26px] md:text-3xl text-[#163D2E] leading-tight">{taskTitle(myAssigned)}</h2>
                      <div className="mt-2 w-14 h-[3px] bg-[#C29845] rounded-full"></div>
                    </div>
                    <span className="px-3.5 py-1 text-xs font-medium text-[#4C5B52] border border-[#CCD5CD] rounded-md bg-[#FBFDFB] flex-shrink-0 mt-1">{FLOW_CHIP[flowOf(myAssigned)].label}</span>
                  </div>
                  <div className="mt-4 mb-6 w-full bg-[#E5EAE5] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#B99147] h-full rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <div className="space-y-5 border-b border-[#EDF1ED] pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Sponsor</span>
                        <span className="text-base text-[#192A21] font-medium inline-flex items-center gap-2 flex-wrap">{sponsorLabelOf(myAssigned, user) || 'Not yet assigned'}{sponsorLabelOf(myAssigned, user) && <span className="text-[9px] font-bold tracking-wide uppercase text-[#257657] bg-[#EAF4EE] border border-[#CBE2D3] rounded px-1.5 py-0.5">Verified sponsor</span>}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Recipient</span>
                        <span className="text-base text-[#192A21] font-medium inline-flex items-center gap-2 flex-wrap">{pickStr(myAssigned.recipientName) || '—'}{pickStr(myAssigned.recipientRelation) ? ` (${pickStr(myAssigned.recipientRelation)})` : ''}{pickStr(myAssigned.recipientName) && <span className="text-[9px] font-bold tracking-wide uppercase text-[#8F6D32] bg-[#F7F1E4] border border-[#E3D9C2] rounded px-1.5 py-0.5">Beneficiary</span>}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Order ID</span>
                        <span className="text-base text-[#192A21] font-medium">{orderCode(myAssigned)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Progress</span>
                        <span className="text-base text-[#192A21] font-medium">0 of {flowStepLib(flowOf(myAssigned)).length} completed</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Earnings ({Math.round(SHARE * 100)}%)</span>
                        {isDonation(myAssigned) ? (
                          <span className="text-base text-[#192A21] font-medium inline-flex items-center gap-1"><FaLock className="text-[#8B9890]" /> {Math.round(SHARE * 100)}% (after review)</span>
                        ) : (
                          <span className="text-base text-[#192A21] font-medium">PKR {earnOf(myAssigned).toLocaleString()}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Type</span>
                        <span className="text-base text-[#192A21] font-medium">{KIND_LABEL[flowOf(myAssigned)]}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[14.5px] leading-relaxed text-[#414E46] mt-6">{taskDesc(myAssigned)}</p>

                    {myAssigned.reason && myAssigned.reason !== 'N/A' && (
                      <div className="mt-5 pl-4 border-l-2 border-[#BE9647]">
                        <p className="text-sm text-[#27382E]">Reason for ibadah: {myAssigned.reason}</p>
                      </div>
                    )}
                    {myAssigned.notes && (
                      <div className="mt-4 pl-4 border-l-2 border-[#BE9647]">
                        <p className="text-sm text-[#27382E]">Note from sponsor: {myAssigned.notes}</p>
                      </div>
                    )}

                    <TaskTimer order={myAssigned} now={now} />

                    <div className="mt-7 flex flex-wrap items-center gap-3.5">
                      <button
                        onClick={() => handleStartTask(myAssigned._id)}
                        className="bg-[#0E4230] hover:bg-[#093224] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <FaPlay /> Start Task — Unlock Step 1
                      </button>
                    </div>
                  </article>
              )}

              {/* ===== ACTIVE TASK — FRONTMOST CARD (identity + description + map + one-by-one guided steps) ===== */}
              {myActive && (
                <article ref={activeRef} className="bg-white border border-[#E1E7E1] rounded-xl p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-[26px] md:text-3xl text-[#163D2E] leading-tight">{taskTitle(myActive)}</h2>
                      <div className="mt-2 w-14 h-[3px] bg-[#C29845] rounded-full"></div>
                    </div>
                    <span className="px-3.5 py-1 text-xs font-medium text-[#4C5B52] border border-[#CCD5CD] rounded-md bg-[#FBFDFB] flex-shrink-0 mt-1">{FLOW_CHIP[flowOf(myActive)].label}</span>
                  </div>
                  <div className="mt-4 mb-6 w-full bg-[#E5EAE5] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#B99147] h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((guidedProgress(myActive).done / Math.max(1, guidedProgress(myActive).total)) * 100)}%` }}></div>
                  </div>
                  <div className="space-y-5 border-b border-[#EDF1ED] pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Sponsor</span>
                        <span className="text-base text-[#192A21] font-medium inline-flex items-center gap-2 flex-wrap">{sponsorLabelOf(myActive, user) || 'Not yet assigned'}{sponsorLabelOf(myActive, user) && <span className="text-[9px] font-bold tracking-wide uppercase text-[#257657] bg-[#EAF4EE] border border-[#CBE2D3] rounded px-1.5 py-0.5">Verified sponsor</span>}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Recipient</span>
                        <span className="text-base text-[#192A21] font-medium inline-flex items-center gap-2 flex-wrap">{pickStr(myActive.recipientName) || '—'}{pickStr(myActive.recipientRelation) ? ` (${pickStr(myActive.recipientRelation)})` : ''}{pickStr(myActive.recipientName) && <span className="text-[9px] font-bold tracking-wide uppercase text-[#8F6D32] bg-[#F7F1E4] border border-[#E3D9C2] rounded px-1.5 py-0.5">Beneficiary</span>}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Order ID</span>
                        <span className="text-base text-[#192A21] font-medium">{orderCode(myActive)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Progress</span>
                        <span className="text-base text-[#192A21] font-medium">{guidedProgress(myActive).done} of {guidedProgress(myActive).total} completed</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Earnings ({Math.round(SHARE * 100)}%)</span>
                        {isDonation(myActive) ? (
                          <span className="text-base text-[#192A21] font-medium inline-flex items-center gap-1"><FaLock className="text-[#8B9890]" /> {Math.round(SHARE * 100)}% (after review)</span>
                        ) : (
                          <span className="text-base text-[#192A21] font-medium">PKR {earnOf(myActive).toLocaleString()}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-[#717E77] block mb-1">Type</span>
                        <span className="text-base text-[#192A21] font-medium">{KIND_LABEL[flowOf(myActive)]}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[14.5px] leading-relaxed text-[#414E46] mt-6">{taskDesc(myActive)}</p>

                    {/* Reference action row: Start step N / Upload proof / Message admin */}
                    {(() => {
                      const stepsBtn = flowStepLib(flowOf(myActive));
                      const ledgerBtn = loadLedger(myActive._id);
                      let openIdx = stepsBtn.findIndex((s, i) => !stepDone(myActive, stepsBtn, i, ledgerBtn));
                      const allDone = openIdx === -1;
                      if (openIdx === -1) openIdx = 0;
                      return (
                        <div className="flex flex-wrap items-center gap-3.5 mt-6">
                          <button onClick={() => openStepModal(myActive, openIdx)} disabled={allDone}
                            className={`text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${allDone ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#0E4230] hover:bg-[#093224] text-white'}`}>
                            <FaPlay /> {allDone ? 'All steps submitted' : `Start step ${openIdx + 1}`}
                          </button>
                          <button onClick={quickUploadProof} className="border border-[#CBD4CB] hover:bg-gray-50 text-[#1F2F25] text-sm font-medium px-5 py-2.5 rounded-lg bg-white flex items-center gap-2 transition-colors">
                            <FaUpload /> Upload proof
                          </button>
                          <button onClick={() => setIsChatOpen(true)} className="text-[#2B3B31] hover:text-black text-sm font-medium px-3 py-2.5 flex items-center gap-2 transition-colors">
                            <FaCommentDots /> Message admin
                          </button>
                        </div>
                      );
                    })()}

                    {myActive.reason && myActive.reason !== 'N/A' && (
                      <div className="mt-5 pl-4 border-l-2 border-[#BE9647]">
                        <p className="text-sm text-[#27382E]">Reason for ibadah: {myActive.reason}</p>
                      </div>
                    )}
                    {myActive.notes && (
                      <div className="mt-4 pl-4 border-l-2 border-[#BE9647]">
                        <p className="text-sm text-[#27382E]">Note from sponsor: {myActive.notes}</p>
                      </div>
                    )}

                    <TaskTimer order={myActive} mode="active" now={now} />

                    <div className="mt-4">
                      <StepFlow order={myActive} openStepModal={openStepModal} logTick={logTick} />
                    </div>
                  </article>
              )}

              {/* ===== NEW REQUESTS (Pending) ===== */}
              {!isBusy && newRequests.length > 0 && (
                <div ref={requestsRef} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><FaBell /> New Task Requests ({newRequests.length})</h3>
                    </div>
                    {/* v8.0: orders v2 auto-assigns Pending requests to available performers */}
                    <p className="text-xs text-gray-500 mt-1">Open requests can be auto-assigned to any available performer at booking time — accept fast to claim one yourself.</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {newRequests
                      .filter(o => !searchQuery || `${o.serviceType} ${o.recipientName} ${o.sponsor ? o.sponsor.firstName : ''}`.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(order => (
                      <div key={order._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-gray-900">{taskTitle(order)}</h4>
                          <p className="text-[12px] text-gray-500 leading-relaxed pr-2">{taskDesc(order)}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2"><FaUserTag /> Recipient: {pickStr(order.recipientName) || '—'} ({pickStr(order.recipientRelation) || 'N/A'})</p>
                          <p className="text-sm text-gray-500">Sponsor: {sponsorLabelOf(order, user) || '—'}</p>
                          {isDonation(order) ? (
                            <p className="text-sm text-gray-600 font-bold mt-2 flex items-center gap-1"><FaLock /> {PRICE_HIDDEN}</p>
                          ) : (
                            <p className="text-sm text-gray-700 font-bold mt-2 flex items-center gap-2"><FaMoneyBillWave /> Your Earning: PKR {earnOf(order).toLocaleString()}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartTask(order._id)}
                          className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <FaCheck /> Accept Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== LIVE EMPTY STATE ===== */}
              {!isBusy && newRequests.filter(o => !searchQuery || `${o.serviceType} ${o.recipientName}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FaKaaba className="text-5xl text-gray-200 mx-auto mb-4" />
                    <p className="text-lg font-extrabold text-gray-700">You are #{queuePos} in the task queue</p>
                    <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      New bookings are auto-assigned to available performers the moment they arrive — {lvl.name} level performers are picked first. Next task expected within {etaText}. Keep your availability ON.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">{newRequests.length} open request(s) in system</span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">{lvl.name} • {totalPoints} pts</span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Streak: {streak.count} day(s)</span>
                      {availableBalance > 0 && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">PKR {availableBalance.toLocaleString()} ready to withdraw</span>
                      )}
                    </div>
                 </div>
              )}
            </>
          )}

          {/* ================= HISTORY TAB (timeline view) ================= */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FaHistory /> Task History Timeline</h3>
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-600">{myCompleted.length} Completed</span>
              </div>
              <div className="p-5">
                {myCompleted.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No completed tasks yet. Complete your first task — it unlocks the First Ibadah badge!</div>
                ) : (
                  <div className="relative pl-7">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full"></div>
                    {myCompleted.map(order => {
                      const prog = milestoneProgress(order);
                      return (
                        <div key={order._id} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-7 top-5 w-6 h-6 rounded-full bg-green-500 border-4 border-green-100 flex items-center justify-center">
                            <FaCheck className="text-white text-[9px]" />
                          </div>
                          <div className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-extrabold text-gray-900">{taskTitle(order)}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Completed: {new Date(order.updatedAt).toLocaleDateString()} • {prog.done}/{prog.total} milestones verified</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${prog.pct}%` }}></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400">{prog.pct}%</span>
                                  {onTimeCheck(order) && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">ON-TIME</span>}
                                </div>
                              </div>
                              <div className="text-left sm:text-right flex-shrink-0">
                                {isDonation(order) ? (
                                  <span className="text-purple-600 font-bold text-xs flex items-center gap-1 sm:justify-end"><FaLock /> Price Hidden</span>
                                ) : (
                                  <span className="text-green-600 font-bold text-sm block">PKR {earnOf(order).toLocaleString()}</span>
                                )}
                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-1">PAID</span>
                                {order.certificateUrl && (
                                  <a href={order.certificateUrl} target="_blank" rel="noreferrer" className="block text-[10px] font-bold text-blue-600 hover:underline mt-1">View Certificate</a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= FEEDBACKS TAB ================= */}
          {activeTab === 'feedbacks' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sponsor Feedbacks</h3>
              {myCompleted.length === 0 ? (
                <p className="text-gray-400 text-sm">Sponsor feedback will appear here after you complete a task.</p>
              ) : (
                <div className="space-y-4">
                  {myCompleted.slice(0, 4).map(order => (
                    <div key={order._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{sponsorLabelOf(order, user) || 'Anonymous Sponsor'}</h4>
                        <div className="flex text-yellow-400 text-sm"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
                      </div>
                      <p className="text-sm text-gray-600">Task "{taskTitle(order)}" — "The photo proofs gave me complete peace of mind. JazakAllah Khair!"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= EARNINGS TAB (balance + chart + payouts) ================= */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6 rounded-xl">
                <p className="text-sm text-gray-500">Available Balance ({Math.round(SHARE * 100)}% share tier)</p>
                <h3 className="text-4xl font-extrabold mt-2 text-gray-900">PKR {availableBalance.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Lifetime: PKR {totalEarnings.toLocaleString()} • Requested: PKR {withdrawnTotal.toLocaleString()}</p>
                {myActive && (
                  <p className="text-sm mt-3 bg-gray-50 border border-gray-100 inline-block px-3 py-1.5 rounded-lg">
                    {isDonation(myActive) ? (
                      <>In Progress: <span className="font-bold text-accent inline-flex items-center gap-1"><FaLock /> Price Hidden</span> (Rules &amp; Regulations apply)</>
                    ) : (
                      <>In Progress: <span className="font-bold text-accent">PKR {pendingEarnings.toLocaleString()}</span> (released after completion)</>
                    )}
                  </p>
                )}
                <button onClick={openWithdraw} disabled={availableBalance < 500} className="mt-4 bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  <FaArrowUp /> Withdraw Funds
                </button>
                {availableBalance < 500 && <p className="text-[10px] text-gray-400 mt-2">Minimum withdrawal is PKR 500 — complete more tasks to unlock payouts.</p>}
              </div>

              <EarningsChart chartData={chartData} earnRange={earnRange} setEarnRange={setEarnRange} share={SHARE} />

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaMoneyCheckAlt className="text-primary" /> Payout History</h3>
                {payouts.length === 0 ? (
                  <p className="text-gray-400 text-sm">No withdrawal requests yet. Submit one from the Withdraw button above.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="pb-2 pr-3">Date</th>
                          <th className="pb-2 pr-3">Method</th>
                          <th className="pb-2 pr-3">Account</th>
                          <th className="pb-2 pr-3 text-right">Amount</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payouts.map(p => (
                          <tr key={p.id}>
                            <td className="py-2.5 pr-3 text-gray-500 text-xs">{new Date(p.at).toLocaleDateString()}</td>
                            <td className="py-2.5 pr-3 font-bold text-gray-700 text-xs flex items-center gap-1.5">{p.method === 'Bank Transfer' ? <FaUniversity className="text-primary" /> : <FaMobileAlt className="text-green-600" />} {p.method}</td>
                            <td className="py-2.5 pr-3 text-gray-500 text-xs">{p.accName || ''} • {(p.accNo || '').length > 4 ? `****${(p.accNo || '').slice(-4)}` : (p.accNo || '')}</td>
                            <td className="py-2.5 pr-3 text-right font-extrabold text-gray-800">PKR {p.amount.toLocaleString()}</td>
                            <td className="py-2.5 text-right">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : p.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{p.status.toUpperCase()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Transaction History (Completed Tasks)</h3>
                {myCompleted.length === 0 ? (
                  <p className="text-gray-400 text-sm">No transactions yet. Complete a task to get started.</p>
                ) : (
                  <div className="space-y-3">
                    {myCompleted.map(o => (
                      <div key={o._id} className="flex justify-between text-sm border-b pb-2">
                        <span className="text-gray-600">{taskTitle(o)}</span>
                        {isDonation(o) ? (
                          <span className="font-bold text-purple-600 inline-flex items-center gap-1"><FaLock /> Price Hidden</span>
                        ) : (
                          <span className="font-bold text-green-600">+ PKR {earnOf(o).toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= PROFILE & STATS TAB (briefing + stats live here) ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-md font-bold text-gray-800 flex items-center gap-2"><FaChartBar className="text-primary" /> My Stats &amp; Today&apos;s Briefing</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">The Dashboard front stays 100% focused on your active task.</p>
              </div>

              <BriefingCard prayerData={prayerData} weather={weather} queuePos={queuePos} etaText={etaText} openCount={newRequests.length} />

              {/* --- v8.1 AVAILABILITY (moved out of the name menu) --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-gray-800 flex items-center gap-2"><FaUserCheck className="text-primary" /> Availability</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      {isBusy ? 'Busy is automatic while a task is assigned or in progress — it clears when the task finishes.' : 'Available performers receive new bookings; Busy pauses new assignments.'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAvailability}
                    disabled={isBusy}
                    className={`w-12 h-6 rounded-full relative flex-shrink-0 transition-colors ${acceptingTasks ? 'bg-[#0F4D38]' : 'bg-[#C9D2CA]'}`}
                    title={isBusy ? 'Busy while a task is assigned or in progress' : 'Tap to switch'}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${acceptingTasks ? 'left-[26px]' : 'left-0.5'}`}></span>
                  </button>
                </div>
                <p className={`text-xs font-extrabold mt-3 ${acceptingTasks ? 'text-green-700' : 'text-red-600'}`}>
                  {acceptingTasks ? 'Available for Tasks' : isBusy ? 'Busy with Task' : 'Unavailable'}
                </p>
              </div>

              {/* --- v8.1 PROFILE STRENGTH (moved out of the name menu) --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-extrabold text-gray-800 flex items-center gap-2"><FaCheckDouble className="text-primary" /> Profile Strength</h3>
                  <p className={`text-xs font-extrabold ${profilePct === 100 ? 'text-green-600' : 'text-amber-600'}`}>{profilePct}%</p>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${profilePct === 100 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${profilePct}%` }}></div>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {profileChecks.map(c => (
                    <p key={c.label} className={`text-[11px] font-semibold flex items-center gap-1.5 ${c.done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                      {c.done ? <FaCheckCircle className="text-green-500" /> : <FaExclamationTriangle className="text-amber-500" />}
                      {c.label}
                    </p>
                  ))}
                </div>
                {nextProfileHint && profilePct < 100 && (
                  <p className="text-[11px] text-amber-600 font-bold mt-3 leading-snug bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{nextProfileHint}</p>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <CountStat icon={FaMoneyBillWave} label="Earnings" value={totalEarnings} prefix="PKR " tone="text-green-600" sub={`${Math.round(SHARE * 100)}% share tier`} />
                <CountStat icon={FaTasks} label="Tasks Done" value={myCompleted.length} tone="text-gray-800" sub="+100 pts each" />
                <CountStat icon={FaBolt} label="Performance" value={perfScore} suffix="/100" tone="text-blue-600" sub={perfScore == null ? 'Complete a task to unlock' : perfLabel} />
                <CountStat icon={FaCrown} label="Points" value={totalPoints} tone="text-yellow-600" sub={`Level: ${lvl.name}`} />
              </div>

              <LevelRing totalPoints={totalPoints} lvl={lvl} lvlProgress={lvlProgress} nextLvl={nextLvl} queuePos={queuePos} />

              <BadgeShelf badges={badges} />

              {leaderboard.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-extrabold text-gray-800 flex items-center gap-2"><FaMedal className="text-accent" /> Monthly Leaderboard</h3>
                    <span className="text-[10px] font-bold text-gray-400">Top {leaderboard.length} performers — tasks this month</span>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.map((p, i) => {
                      const isMe = p.id === user.id;
                      return (
                        <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${isMe ? 'bg-primary/5 border-primary/30' : 'bg-gray-50 border-gray-100'}`}>
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                            {i === 0 ? <FaTrophy /> : i < 3 ? <FaMedal /> : `#${i + 1}`}
                          </span>
                          <p className={`text-sm font-bold flex-1 min-w-0 truncate ${isMe ? 'text-primary' : 'text-gray-700'}`}>
                            {p.name} {isMe && <span className="text-[9px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
                          </p>
                          <span className="text-xs font-extrabold text-gray-600">{p.month} this month</span>
                          <span className="text-[10px] font-bold text-gray-400 hidden sm:inline">{p.total} total • ~{p.total * 100} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- PROFILE PICTURE CARD --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Profile Picture</h3>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-green-100 shadow-md" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white text-4xl border-4 border-green-100 shadow-md font-bold">
                        {user && user.firstName ? user.firstName[0].toUpperCase() : <FaUserCircle />}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 shadow-md border-2 border-white" title="Change photo">
                      {picUploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaCamera className="text-sm" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePicUpload} disabled={picUploading} />
                    </label>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{user && user.firstName} {user && user.lastName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG/PNG/WebP — max 8MB</p>
                    <p className="text-[11px] text-green-600 font-bold mt-1 flex items-center gap-1"><FaCheckCircle /> Saved in the database (stays after logout too)</p>
                  </div>
                </div>
              </div>

              {/* --- PERSONAL INFO CARD --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">First Name *</label>
                    <input type="text" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Last Name *</label>
                    <input type="text" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
                    <input type="tel" placeholder="03001234567" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Country</label>
                    <input type="text" placeholder="Pakistan" value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Email (cannot be changed)</label>
                    <input type="email" value={(user && user.email) || ''} disabled className="w-full px-4 py-2.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 text-sm cursor-not-allowed" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Umrah/Hajj Experience</label>
                    <select
                      value={profileForm.experience}
                      onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm"
                    >
                      <option value="">Not set</option>
                      <option value="1-3 Times">1-3 Times</option>
                      <option value="4-7 Times">4-7 Times</option>
                      <option value="8+ Times">8+ Times</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleProfileSave} disabled={savingProfile} className="mt-5 bg-primary text-white font-bold px-8 py-2.5 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm">
                  {savingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaCheckCircle />} Save Profile
                </button>
              </div>

              {/* --- BANK / PAYOUT DETAILS CARD --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2"><FaUniversity className="text-primary" /> Bank / Payout Details</h3>
                <p className="text-xs text-gray-400 mb-4">Required for withdrawals. Without these, your payout is delayed.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name / Wallet</label>
                    <input type="text" placeholder="e.g. Meezan Bank / Easypaisa" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Account Title *</label>
                    <input type="text" placeholder="Exact name on the account" value={bank.accName} onChange={(e) => setBank({ ...bank, accName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Account Number / IBAN *</label>
                    <input type="text" placeholder="PK00XXXX0000000000000000" value={bank.accNo} onChange={(e) => setBank({ ...bank, accNo: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                </div>
                <button onClick={saveBank} className="mt-5 bg-primary text-white font-bold px-8 py-2.5 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm">
                  <FaCheckCircle /> Save Payout Details
                </button>
              </div>

              {/* --- PERFORMER TYPE CARD --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2"><FaMosque className="text-primary" /> Performer Type</h3>
                <p className="text-xs text-gray-400 mb-4">What kind of performer are you? (you can change this anytime)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTypeChange('Ibadah Team')}
                    disabled={typeSaving}
                    className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${performerType === 'Ibadah Team' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <FaMosque className={`text-xl mt-0.5 ${performerType === 'Ibadah Team' ? 'text-primary' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-bold flex items-center gap-1.5 ${performerType === 'Ibadah Team' ? 'text-primary' : 'text-gray-700'}`}>
                        Ibadah Team {performerType === 'Ibadah Team' && <FaCheckCircle className="text-xs" />}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Official team performer — Admin assigns tasks to you.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleTypeChange('Self/Family')}
                    disabled={typeSaving}
                    className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${performerType === 'Self/Family' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <FaUsers className={`text-xl mt-0.5 ${performerType === 'Self/Family' ? 'text-primary' : 'text-gray-400'}`} />
                    <div>
                      <p className={`text-sm font-bold flex items-center gap-1.5 ${performerType === 'Self/Family' ? 'text-primary' : 'text-gray-700'}`}>
                        Self / Family {performerType === 'Self/Family' && <FaCheckCircle className="text-xs" />}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">You or a family member perform the Umrah — connecting with an agency is required.</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* --- AGENCY CONNECT CARD --- */}
              {performerType === 'Self/Family' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2"><FaHandshake className="text-primary" /> Agency Connection</h3>
                  <p className="text-xs text-gray-400 mb-4">Want to travel for Umrah yourself? We connect you with a partner agency (visa, hotel, transport).</p>

                  {agencyConnect === 'Connected' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                      <FaBuilding className="text-green-600 text-xl mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-700">Connected: {user.agencyName || 'Partner Agency'}</p>
                        <p className="text-[11px] text-green-600 mt-0.5">The agency will contact you soon. Travel details will be provided by the agency.</p>
                      </div>
                    </div>
                  )}

                  {agencyConnect === 'Requested' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <FaHourglassHalf className="text-amber-600 text-xl mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-700">Request Pending — waiting for Admin approval</p>
                        <p className="text-[11px] text-amber-600 mt-0.5">Admin will review your request and connect you with an agency.</p>
                      </div>
                    </div>
                  )}

                  {agencyConnect === 'None' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-3">You are not connected with any agency yet.</p>
                      <button
                        onClick={handleAgencyRequest}
                        disabled={agencyLoading}
                        className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm disabled:opacity-60"
                      >
                        {agencyLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaHandshake />} Connect with Agency
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* --- PASSWORD CHANGE CARD --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2"><FaKey className="text-primary" /> Change Password</h3>
                <p className="text-xs text-gray-400 mb-4">Your current password is required for security.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Current Password</label>
                    <input type="password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">New Password</label>
                    <input type="password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Confirm New Password</label>
                    <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                  </div>
                </div>
                <button onClick={handlePasswordSave} disabled={savingProfile} className="mt-5 bg-gray-800 text-white font-bold px-8 py-2.5 rounded-lg hover:bg-gray-900 flex items-center gap-2 text-sm">
                  {savingProfile ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaKey />} Update Password
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ===== v7.6 RIGHT RAIL (Stitch mockup: Quick Actions + How It Works) ===== */}
        {activeTab === 'tasks' && (
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Quick Actions */}
            <section className="bg-white border border-[#E1E7E1] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <p className="text-sm font-bold text-[#18261F] flex items-center gap-2"><span className="text-[#C29845]"><FaBolt /></span> Quick Actions</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => { const o = myActive || myAssigned; if (o) openStepModal(o, 0); }}
                  disabled={!myActive && !myAssigned}
                  className="h-20 rounded-lg bg-[#0E4230] hover:bg-[#093224] text-white flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FaPlay className="text-sm" /> Start Task
                </button>
                <button onClick={quickUploadProof} className="h-20 rounded-lg border border-[#D5DCD5] bg-white hover:bg-[#F4F7F4] text-[#18261F] flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-colors">
                  <FaUpload className="text-sm text-[#0F4D38]" /> Upload Proof
                </button>
                <button onClick={() => setIsChatOpen(true)} className="h-20 rounded-lg border border-[#D5DCD5] bg-white hover:bg-[#F4F7F4] text-[#18261F] flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-colors">
                  <FaCommentDots className="text-sm text-[#0F4D38]" /> Chat Admin
                </button>
                <button onClick={() => { markGuideRead(); navigate('/performer-rules'); }} className="h-20 rounded-lg border border-[#D5DCD5] bg-white hover:bg-[#F4F7F4] text-[#18261F] flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-colors">
                  <FaScroll className="text-sm text-[#C29845]" /> Read Guide
                </button>
              </div>
            </section>
            {/* How It Works */}
            <section className="bg-white border border-[#E1E7E1] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <p className="text-sm font-bold text-[#18261F]">How It Works</p>
              <ol className="mt-3 space-y-3">
                {[
                  'Press Start Task — Step 1 unlocks.',
                  'Perform the step, then tap Complete + Proof (photo / video / message + GPS).',
                  'Steps open one by one — Step 2 waits for Step 1, and a done step locks forever.',
                  "Tawaf, Sa'i and Rami need their 7x counter here.",
                  'Every photo passes the AI reference check (min 60%) before the step locks.',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#0F4D38] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-[12.5px] leading-snug text-[#414E46]">{t}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        )}
        </div>

      </div>

      {/* ===== v7.2 LIVE LOCATION PAGE (separate page — the Location button opens this) ===== */}
      {mapOpen && (
        <div className="fixed inset-0 z-[70] bg-[#FAFBF9] flex flex-col">
          <header className="bg-white border-b border-[#E5E9E4] h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMapOpen(false)} className="w-9 h-9 rounded-full border border-[#E3E8E3] bg-white flex items-center justify-center text-[#0F4D38] hover:bg-gray-50 transition-colors flex-shrink-0" title="Back to portal">
                <FaArrowLeft />
              </button>
              <div className="min-w-0">
                <h2 className="font-serif text-xl md:text-2xl text-[#163D2E] leading-tight truncate">Your live location</h2>
                <p className="text-[11px] text-[#69786F] leading-tight">This is you — standing here. Every proof you upload carries this same GPS pin.</p>
              </div>
            </div>
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${pageGeo === 'on' ? 'bg-[#0F4D38] text-white' : 'bg-white border border-[#D5DCD5] text-[#55635B]'}`}>
              <span className={`w-2 h-2 rounded-full ${pageGeo === 'on' ? 'bg-[#7FD1A8] animate-pulse' : 'bg-[#C68520]'}`}></span>
              {pageGeo === 'on' ? 'Location on' : 'Location off'}
            </span>
          </header>

          <div className="flex-1 relative min-h-0">
            {mapCoords ? (
              <>
                <iframe
                  title="Live location map"
                  className="absolute inset-0 w-full h-full border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(mapCoords.lng - 0.006).toFixed(6)}%2C${(mapCoords.lat - 0.004).toFixed(6)}%2C${(mapCoords.lng + 0.006).toFixed(6)}%2C${(mapCoords.lat + 0.004).toFixed(6)}&layer=mapnik&marker=${mapCoords.lat.toFixed(6)}%2C${mapCoords.lng.toFixed(6)}`}
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-[#E3E8E3] px-4 py-2 flex items-center gap-2 max-w-[92%]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#257657] animate-pulse flex-shrink-0"></span>
                  <span className="text-xs font-extrabold text-[#18261F] whitespace-nowrap">You are here</span>
                  <span className="text-[11px] text-[#69786F] truncate">{mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)} · ±{mapCoords.acc} m</span>
                </div>
              </>
            ) : mapError ? (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl border border-[#E3E8E3] shadow-sm p-6 max-w-sm text-center">
                  <FaMapMarkerAlt className="text-3xl text-[#C68520] mx-auto" />
                  <p className="text-sm font-extrabold text-[#18261F] mt-3">Location is off</p>
                  <p className="text-xs text-[#55635B] mt-1.5 leading-relaxed">{mapError}</p>
                  <button onClick={fetchMapLocation} className="mt-4 bg-[#0E4230] hover:bg-[#093224] text-white text-xs font-extrabold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 transition-colors">
                    <FaSyncAlt /> Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="inline-block w-10 h-10 border-4 border-[#0F4D38] border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-sm font-bold text-[#18261F] mt-3">{mapLocating ? 'Finding your position…' : 'Preparing the map…'}</p>
                  <p className="text-xs text-[#69786F] mt-1">Allow location access in the browser prompt if it appears.</p>
                </div>
              </div>
            )}
            {mapCoords && (
              <button onClick={fetchMapLocation} className="absolute top-4 right-4 bg-white border border-[#E3E8E3] rounded-full shadow-sm px-3.5 py-2 text-xs font-extrabold text-[#0F4D38] hover:bg-gray-50 inline-flex items-center gap-1.5 transition-colors">
                <FaSyncAlt className={mapLocating ? 'animate-spin' : ''} /> Refresh position
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== FOOTER (dark green mockup: support + legal + tagline) ===== */}
      <footer className="bg-[#093527] text-white pt-12 pb-7 border-t border-[#0e4835] mt-auto">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            <div className="md:col-span-6">
              <div className="text-xl font-bold tracking-tight mb-3">
                <span className="text-white">Ibadah</span><span className="text-[#CBA048]">Connect</span>
              </div>
              <p className="text-sm text-[#9BB1A5] max-w-sm leading-relaxed">Performer portal. Every proof you upload is seen by the sponsor live.</p>
            </div>
            <div className="md:col-span-3">
              <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2.5 text-sm text-[#9BB1A5]">
                <li><button onClick={() => setIsChatOpen(true)} className="hover:text-white transition-colors">Message admin</button></li>
                <li><a href="https://wa.me/923390138178" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp +92 339 0138178</a></li>
                <li><button onClick={() => { markGuideRead(); navigate('/performer-rules'); }} className="hover:text-white transition-colors">Performer guide</button></li>
              </ul>
            </div>
            <div className="md:col-span-3">
              <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2.5 text-sm text-[#9BB1A5]">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Privacy policy</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Terms of service</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white transition-colors">Refund policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#154637] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7B9588]">
            <div>&copy; {new Date().getFullYear()} IbadahConnect. Your amanah, our responsibility.</div>
            <div className="mt-2 sm:mt-0">Portal v7.6 — Pakistan to Makkah</div>
          </div>
        </div>
      </footer>

      {/* ================= STEP PROOF MODAL (v6.0 — step-aware: message + photos + receipt + video + GPS + AI check) ================= */}
      {proofModal && modalStep && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !proofSaving && setProofModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-primary text-white p-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold flex items-center gap-2"><FaVideo /> Step {proofModal.stepIdx + 1}: {modalStep.title}</h3>
              <button onClick={() => setProofModal(null)} className="hover:bg-white/20 p-1 rounded-full" disabled={proofSaving}><FaTimesCircle /></button>
            </div>
            <div className="p-6">
              {/* Step info */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Guided Step {proofModal.stepIdx + 1} of {flowStepLib(proofModal.flow).length}</p>
                <p className="font-bold text-gray-900">
                  {modalStep.title}
                  <span className="block text-[10px] font-semibold text-gray-500 mt-0.5">Task: {proofModal.title}</span>
                  <span className="block text-[10px] font-semibold text-gray-400 mt-0.5">Platform milestone: {proofModal.msLabel || `Milestone ${modalStep.msIdx + 1}`}{proofModal.closes ? ' — completing this step sends the proof to the sponsor' : ''}</span>
                </p>
              </div>

              {/* Reference pic */}
              {modalStep.img && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-1.5"><FaImage /> Reference Picture — AI compares your upload against this</p>
                  <a href={modalStep.img} target="_blank" rel="noreferrer">
                    <img src={modalStep.img} alt={`${modalStep.title} reference`} className="w-full h-36 object-cover rounded-xl border border-gray-200 shadow-sm" />
                  </a>
                </div>
              )}

              {/* MESSAGE BLOCK (niyyah / talbiyah / report — shown to the sponsor) */}
              {modalNeed.msg && modalStep.msgTpl && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5 mb-2">
                    <FaEnvelopeOpenText /> Message to Sponsor <span className="text-purple-400 normal-case font-semibold">— shown on the tracking page</span>
                  </p>
                  <div className="space-y-2">
                    {(modalStep.msgFields || []).map((fd) => (
                      <div key={fd.key}>
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">{fd.label}</label>
                        {fd.type === 'select' ? (
                          <select
                            value={msgFields[fd.key] || ''}
                            onChange={(e) => setMsgFields({ ...msgFields, [fd.key]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-sm"
                          >
                            {(fd.options || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={fd.ph || ''}
                            value={msgFields[fd.key] || ''}
                            onChange={(e) => setMsgFields({ ...msgFields, [fd.key]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-sm"
                          />
                        )}
                      </div>
                    ))}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Message (editable)</label>
                        {msgDirty && (
                          <button onClick={() => { setMsgDirty(false); setMsgText(''); }} className="text-[10px] font-bold text-primary underline">Reset to template</button>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={modalMsgValue}
                        onChange={(e) => { setMsgText(e.target.value); setMsgDirty(true); }}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AUTOMATIC LOCATION CARD */}
              <div
                onClick={() => { if (locStatus === 'captured') setShowCoords(v => !v); }}
                className={`rounded-xl p-3 mb-4 border transition-all ${
                  locStatus === 'captured' ? 'bg-green-50 border-green-200 cursor-pointer hover:shadow-sm' :
                  locStatus === 'capturing' ? 'bg-blue-50 border-blue-200' :
                  locStatus === 'error' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                  <FaMapMarkerAlt className="text-primary" /> Automatic Location
                  {modalNeed.gps && <span className="text-green-600 normal-case">— required for this step</span>}
                  {locStatus === 'capturing' && <span className="text-blue-600 normal-case">— locating...</span>}
                </p>

                {locStatus === 'captured' && proofLocation && !showCoords && (
                  <p className="text-xs text-green-700 font-bold mt-1 flex items-center gap-1"><FaCheckCircle /> Location captured — click here to view coordinates</p>
                )}
                {locStatus === 'captured' && proofLocation && showCoords && (
                  <p className="text-xs text-green-700 font-bold mt-1 flex items-center gap-1">
                    <FaCheckCircle /> Verified: {proofLocation.lat}, {proofLocation.lng}
                  </p>
                )}
                {locStatus === 'capturing' && (
                  <p className="text-xs text-blue-600 mt-1">Getting GPS coordinates from your browser...</p>
                )}
                {locStatus === 'error' && (
                  <div className="mt-1">
                    <p className="text-xs text-amber-700">Location unavailable (permission blocked or non-secure page).</p>
                    <button onClick={retryLocation} className="mt-1 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"><FaSyncAlt /> Retry Location</button>
                    {modalNeed.gps && !gpsBypass && (
                      <button onClick={() => setGpsBypass(true)} className="mt-1 ml-2 text-[11px] font-bold text-gray-500 hover:underline">Continue without location</button>
                    )}
                  </div>
                )}
              </div>

              {/* PHOTO UPLOAD (multi) */}
              {modalNeed.photos ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 mb-2">
                    <FaCamera /> Upload Proof Photos <span className="text-blue-400 normal-case font-semibold">— minimum {modalNeed.photos}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {proofPhotos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p.preview} alt={`proof ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border-2 border-blue-300 shadow-sm" />
                        {!proofSaving && (
                          <button onClick={() => setProofPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-5 h-5 bg-white border border-gray-200 rounded-full text-red-500 flex items-center justify-center text-[9px]"><FaTimesCircle /></button>
                        )}
                      </div>
                    ))}
                    {proofPhotos.length < 6 && (
                      <label className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-400 cursor-pointer hover:bg-blue-50">
                        {proofUploading ? <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></span> : <FaUpload className="text-sm" />}
                        <span className="text-[8px] font-bold mt-0.5">Add</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleProofPhoto} disabled={proofUploading || proofSaving} />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">Each upload is AI-checked against the reference picture — {AI_MATCH_MIN}%+ match locks the step.</p>
                </div>
              ) : null}

              {/* RECEIPT UPLOAD */}
              {modalNeed.receipt ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5 mb-2">
                    <FaFileAlt /> Purchase Receipt <span className="text-gray-400 normal-case font-semibold">— required</span>
                  </p>
                  <div className="flex items-center gap-3">
                    {receiptState ? (
                      <img src={receiptState.preview} alt="Receipt" className="w-16 h-16 object-cover rounded-xl border-2 border-gray-300 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300"><FaImage /></div>
                    )}
                    <label className="flex-1 block bg-gray-700 text-white text-xs font-bold text-center py-2.5 rounded-lg cursor-pointer hover:bg-gray-800">
                      {proofUploading ? 'Uploading...' : <><FaUpload className="inline mr-1.5" /> {receiptState ? 'Change Receipt' : 'Choose Receipt Photo'}</>}
                      <input type="file" accept="image/*" className="hidden" onChange={handleReceiptFile} disabled={proofUploading || proofSaving} />
                    </label>
                  </div>
                </div>
              ) : null}

              {/* VIDEO UPLOAD */}
              {modalNeed.video ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5 mb-2">
                    <FaVideo /> Video Proof <span className="text-red-400 normal-case font-semibold">— required (max 50MB)</span>
                  </p>
                  <label className="block bg-red-600 text-white text-xs font-bold text-center py-2.5 rounded-lg cursor-pointer hover:bg-red-700">
                    {proofUploading ? 'Uploading...' : <><FaUpload className="inline mr-1.5" /> {videoState ? 'Change Video' : 'Record / Choose Video'}</>}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoFile} disabled={proofUploading || proofSaving} />
                  </label>
                  {videoState && (
                    <p className="text-[10px] text-green-600 font-bold mt-1.5 flex items-center gap-1"><FaCheckCircle /> Video uploaded — ready to submit</p>
                  )}
                </div>
              ) : null}

              {/* NOTE TO SPONSOR (optional) */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Note to sponsor (optional)</label>
                <input
                  type="text"
                  placeholder="Anything you want to tell the sponsor about this step"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm"
                />
              </div>

              {/* AI REFERENCE CHECK BOX */}
              {modalNeed.photos ? (
                <div className={`rounded-xl p-3 border mb-4 ${
                  aiStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
                  aiStatus === 'pass' ? 'bg-green-50 border-green-200' :
                  aiStatus === 'low' ? 'bg-red-50 border-red-200' :
                  aiStatus === 'skip' ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                    <FaRobot className="text-blue-600" /> AI Reference Check (min {AI_MATCH_MIN}%)
                    {aiStatus === 'checking' && <span className="text-blue-600 normal-case">— comparing with the reference pic...</span>}
                  </p>
                  {aiStatus === 'pass' && aiResult && (
                    <p className="text-xs font-bold text-green-700 mt-1 flex items-center gap-1"><FaCheckCircle /> Match {aiResult.pct}% — photo accepted</p>
                  )}
                  {aiStatus === 'low' && aiResult && (
                    <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1"><FaTimesCircle /> Match {aiResult.pct}% — below {AI_MATCH_MIN}%. Retake a clearer photo like the reference pic.</p>
                  )}
                  {aiStatus === 'skip' && (
                    <p className="text-xs text-gray-500 mt-1">AI check offline — your proof will be reviewed manually by Admin.</p>
                  )}
                  {(aiStatus === 'pass' || aiStatus === 'low' || aiStatus === 'skip') && proofPhotos[0] && (
                    <button onClick={() => runAiMatch(proofPhotos[0].url)} className="mt-2 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                      <FaSyncAlt /> Re-run AI Check
                    </button>
                  )}
                </div>
              ) : null}

              {/* OCR box (kept — runs on the first photo) */}
              {proofUrl.trim() && looksLikeImage(proofUrl.trim()) && (ocrStatus === 'checking' || ocrStatus === 'done' || ocrStatus === 'error') && (
                <div className={`rounded-xl p-3 border mb-4 ${
                  ocrStatus === 'checking' ? 'bg-blue-50 border-blue-200' :
                  ocrStatus === 'done' && ocrResult && ocrResult.suggestion === 'verified' ? 'bg-green-50 border-green-200' :
                  ocrStatus === 'done' && ocrResult && ocrResult.suggestion === 'weak-match' ? 'bg-amber-50 border-amber-200' :
                  ocrStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-gray-500">
                    <FaRobot className="text-blue-600" /> AI Proof Verification (OCR)
                    {ocrStatus === 'checking' && <span className="text-blue-600 normal-case">— scanning receipt...</span>}
                  </p>
                  {ocrStatus === 'checking' && (
                    <p className="text-xs text-blue-600 mt-1">AI is reading the text from the image (3-10 seconds)...</p>
                  )}
                  {ocrStatus === 'done' && ocrResult && (
                    <div className="mt-1">
                      <p className={`text-xs font-bold flex items-center gap-1 ${
                        ocrResult.suggestion === 'verified' ? 'text-green-700' :
                        ocrResult.suggestion === 'weak-match' ? 'text-amber-700' : 'text-red-600'
                      }`}>
                        {ocrResult.suggestion === 'verified' && <><FaCheckCircle /> Verified — receipt keywords found</>}
                        {ocrResult.suggestion === 'weak-match' && <><FaExclamationTriangle /> Weak match — Admin will review it</>}
                        {ocrResult.suggestion === 'manual-review' && <><FaTimesCircle /> No receipt keywords found — Admin will review it</>}
                      </p>
                      {ocrResult.matched && ocrResult.matched.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ocrResult.matched.map((w, i) => (
                            <span key={i} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><FaCheck className="text-[8px] text-green-500" /> {w}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1.5">Text readability: {ocrResult.confidence}% • Score: {ocrResult.score}</p>
                    </div>
                  )}
                  {ocrStatus === 'error' && (
                    <p className="text-xs text-red-600 mt-1">AI check failed — you can still submit the proof (Admin will review it manually).</p>
                  )}
                </div>
              )}

              {!proofModal.closes && (
                <p className="text-[10px] text-gray-400 leading-relaxed mb-3 flex items-start gap-1">
                  <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                  This step&apos;s proof is packaged with its milestone — the sponsor receives it on the tracking page as soon as the milestone group completes.
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setProofModal(null)} disabled={proofSaving} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">Cancel</button>
                <button onClick={submitStep} disabled={proofSaving || proofUploading || aiStatus === 'checking' || aiStatus === 'low'} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {proofSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <FaCheckCircle />} {proofModal.closes ? 'Mark Complete' : 'Save + Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= WITHDRAW MODAL (payout request) ================= */}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setWithdrawOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0F4D38] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><FaMoneyCheckAlt /> Request Withdrawal</h3>
              <button onClick={() => setWithdrawOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><FaTimesCircle /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Available Balance</p>
                <p className="text-xl font-extrabold text-green-700">PKR {availableBalance.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Payout Method</label>
                <select value={wForm.method} onChange={(e) => setWForm({ ...wForm, method: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="JazzCash">JazzCash</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Title *</label>
                  <input type="text" value={wForm.accName} onChange={(e) => setWForm({ ...wForm, accName: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Account Number *</label>
                  <input type="text" value={wForm.accNo} onChange={(e) => setWForm({ ...wForm, accNo: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Amount (PKR) — min 500</label>
                <input type="number" min="500" value={wForm.amount} onChange={(e) => setWForm({ ...wForm, amount: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-sm" />
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">Payouts are processed by Admin within 48 hours. Your bank details are saved on this device for faster requests.</p>
              <div className="flex gap-3">
                <button onClick={() => setWithdrawOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-sm">Cancel</button>
                <button onClick={submitWithdraw} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 text-sm flex items-center justify-center gap-2">
                  <FaMoneyCheckAlt /> Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
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